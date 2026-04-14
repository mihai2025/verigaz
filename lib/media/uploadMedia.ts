// lib/media/uploadMedia.ts
export type UploadResult = {
  url: string
  key?: string
  contentType?: string
}

type HandshakeResponse =
  | { direct: true; uploadUrl: string; url: string; key: string; contentType: string }
  | { direct: false }

export type UploadProgress = {
  loaded: number
  total?: number
  percent?: number
}

function mb(sizeBytes: number) {
  return sizeBytes / (1024 * 1024)
}

function inferFolder(folder?: string) {
  const f = String(folder || "uploads").trim().replace(/^\/+|\/+$/g, "")
  return f || "uploads"
}

// ✅ XHR acceptă doar XMLHttpRequestBodyInit (nu ReadableStream)
// BodyInit din fetch include ReadableStream, de aici eroarea TS.
type XhrBody = XMLHttpRequestBodyInit | Document | null | undefined

function xhrRequest(opts: {
  url: string
  method: "POST" | "PUT" | "DELETE"
  headers?: Record<string, string>
  body?: XhrBody
  signal?: AbortSignal
  onProgress?: (p: UploadProgress) => void
}): Promise<{ status: number; text: string; json?: any }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(opts.method, opts.url, true)

    if (opts.headers) {
      for (const [k, v] of Object.entries(opts.headers)) xhr.setRequestHeader(k, v)
    }

    xhr.upload.onprogress = (e) => {
      if (!opts.onProgress) return
      const total = e.lengthComputable ? e.total : undefined
      const percent =
        total && total > 0 ? Math.max(0, Math.min(100, Math.round((e.loaded / total) * 100))) : undefined
      opts.onProgress({ loaded: e.loaded, total, percent })
    }

    xhr.onload = () => {
      const text = xhr.responseText || ""
      let json: any = undefined
      try {
        json = text ? JSON.parse(text) : undefined
      } catch {}
      resolve({ status: xhr.status, text, json })
    }

    xhr.onerror = () => reject(new Error("Network error"))
    xhr.onabort = () => reject(new Error("Aborted"))

    if (opts.signal) {
      if (opts.signal.aborted) xhr.abort()
      else opts.signal.addEventListener("abort", () => xhr.abort(), { once: true })
    }

    xhr.send(opts.body ?? null)
  })
}

/**
 * Upload media (img/video) to /api/media/upload
 * - handshake JSON -> may return presigned URL
 * - direct: PUT to presigned (with progress)
 * - inline: multipart POST (with progress)
 */
export async function uploadMediaWithProgress(
  file: File,
  opts: {
    folder?: string
    forceDirect?: boolean
    signal?: AbortSignal
    token: string
    onProgress?: (p: UploadProgress) => void
  }
): Promise<UploadResult> {
  const folder = inferFolder(opts.folder)
  const sizeMB = mb(file.size)

  // 1) handshake
  const hs = await fetch("/api/media/upload", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.token}`,
    },
    body: JSON.stringify({
      direct: opts.forceDirect === true,
      folder,
      fileName: file.name,
      type: file.type || "application/octet-stream",
      sizeMB,
    }),
    signal: opts.signal,
  })

  if (!hs.ok) {
    const txt = await hs.text().catch(() => "")
    throw new Error(`Handshake failed (${hs.status}): ${txt || hs.statusText}`)
  }

  const data = (await hs.json()) as HandshakeResponse

  // 2) presigned PUT (progress)
  if ("direct" in data && data.direct === true) {
    const put = await xhrRequest({
      url: data.uploadUrl,
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file, // ✅ File este XMLHttpRequestBodyInit
      signal: opts.signal,
      onProgress: opts.onProgress,
    })

    if (put.status < 200 || put.status >= 300) {
      throw new Error(`Direct upload failed (${put.status}): ${put.text || "upload error"}`)
    }

    return { url: data.url, key: data.key, contentType: data.contentType }
  }

  // 3) inline multipart POST (progress)
  const fd = new FormData()
  fd.set("file", file)
  fd.set("folder", folder)

  const res = await xhrRequest({
    url: "/api/media/upload",
    method: "POST",
    headers: {
      authorization: `Bearer ${opts.token}`,
      // ⚠️ NU seta Content-Type manual la FormData (browser pune boundary)
    },
    body: fd, // ✅ FormData este XMLHttpRequestBodyInit
    signal: opts.signal,
    onProgress: opts.onProgress,
  })

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Upload failed (${res.status}): ${res.text || "upload error"}`)
  }

  return (res.json ?? JSON.parse(res.text)) as UploadResult
}

export async function deleteMedia(
  key: string,
  opts: { token: string; folder?: string; signal?: AbortSignal }
): Promise<void> {
  const folder = inferFolder(opts.folder)

  const res = await fetch("/api/media/upload", {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.token}`,
    },
    body: JSON.stringify({ key, folder }),
    signal: opts.signal,
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`Delete failed (${res.status}): ${txt || res.statusText}`)
  }
}
