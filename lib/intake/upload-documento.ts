/**
 * Upload direto para o Storage do Supabase via XMLHttpRequest em vez do
 * cliente supabase-js: é a única API do browser que expõe progresso de
 * envio (fetch não expõe `onUploadProgress`). Faz exatamente a mesma
 * chamada REST que supabase-js faria por trás (POST /storage/v1/object/...
 * com o access_token do usuário), então a RLS de storage.objects se aplica
 * igual.
 */
export function uploadDocumento({
  supabaseUrl,
  anonKey,
  accessToken,
  bucket,
  path,
  file,
  onProgress,
}: {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
  bucket: string;
  path: string;
  file: File;
  onProgress?: (percent: number) => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const encodedPath = path.split("/").map(encodeURIComponent).join("/");
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${encodedPath}`;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    xhr.setRequestHeader("apikey", anonKey);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Falha no upload (HTTP ${xhr.status}).`));
      }
    };

    xhr.onerror = () => reject(new Error("Falha de rede durante o upload."));

    xhr.send(file);
  });
}
