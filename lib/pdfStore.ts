let _file: File | null = null;
let _blobUrl: string | null = null;

export const pdfStore = {
  setFile(file: File) { _file = file; _blobUrl = null; },
  setBlobUrl(url: string) { _blobUrl = url; _file = null; },
  getFile() { return _file; },
  getBlobUrl() { return _blobUrl; },
};
