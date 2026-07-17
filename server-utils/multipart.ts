export interface MultipartPayload {
  fields: Record<string, string>;
  image?: Buffer;
}

export function parseMultipart(body: Buffer, contentType: string | undefined): MultipartPayload {
  const boundary = contentType
    ?.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i)
    ?.slice(1)
    .find(Boolean);
  if (!boundary) throw new Error("Missing multipart boundary");
  const marker = Buffer.from(`--${boundary}`);
  const fields: Record<string, string> = {};
  let image: Buffer | undefined;
  let offset = 0;
  while (true) {
    const start = body.indexOf(marker, offset);
    if (start < 0) break;
    const next = body.indexOf(marker, start + marker.length);
    if (next < 0) break;
    const part = body.subarray(start + marker.length + 2, next - 2);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd >= 0) {
      const headers = part.subarray(0, headerEnd).toString("utf8");
      const name = headers.match(/name="([^"]+)"/i)?.[1];
      const data = part.subarray(headerEnd + 4);
      if (name === "image") image = data;
      else if (name) fields[name] = data.toString("utf8");
    }
    offset = next;
  }
  return { fields, image };
}
