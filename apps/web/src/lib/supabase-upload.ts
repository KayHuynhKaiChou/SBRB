/** PUT a file to a Supabase Storage signed upload URL */
export async function uploadToSignedUrl(
  uploadUrl: string,
  token: string,
  file: File,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'Authorization': `Bearer ${token}`,
      'x-upsert': 'true',
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
}
