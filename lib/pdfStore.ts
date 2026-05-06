let _file: File | null = null;

export const pdfStore = {
  setFile(file: File) { _file = file; },
  getFile() { return _file; },
};
