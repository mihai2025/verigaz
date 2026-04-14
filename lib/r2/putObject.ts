// lib/r2/putObject.ts
// Server-side R2 upload helper pentru fișiere generate (PDF, thumbnails).
// Pentru upload-uri de la client folosim /api/media/upload + uploadMedia.ts.
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

function mustEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client
  const accountId = mustEnv("R2_ACCOUNT_ID")
  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: mustEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: mustEnv("R2_SECRET_ACCESS_KEY"),
    },
  })
  return client
}

export type PutObjectOptions = {
  key: string                 // cale relativă bucket (ex: "verigaz/documents/cert-xyz.pdf")
  body: Uint8Array | Buffer
  contentType: string
  cacheControl?: string       // ex: "public, max-age=31536000, immutable"
  metadata?: Record<string, string>
}

export type PutObjectResult = {
  key: string
  publicUrl: string
}

export async function putObject(opts: PutObjectOptions): Promise<PutObjectResult> {
  const bucket = mustEnv("R2_BUCKET")
  const publicBase = mustEnv("R2_PUBLIC_URL").replace(/\/+$/, "")

  const folderPrefix = (process.env.R2_FOLDER_PREFIX ?? "").replace(/^\/+|\/+$/g, "")
  const fullKey = folderPrefix && !opts.key.startsWith(folderPrefix)
    ? `${folderPrefix}/${opts.key.replace(/^\/+/, "")}`
    : opts.key

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fullKey,
      Body: opts.body,
      ContentType: opts.contentType,
      CacheControl: opts.cacheControl,
      Metadata: opts.metadata,
    }),
  )

  return {
    key: fullKey,
    publicUrl: `${publicBase}/${fullKey}`,
  }
}
