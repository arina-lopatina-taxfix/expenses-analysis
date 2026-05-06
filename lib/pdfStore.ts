let _file: File | null = null;

export const pdfStore = {
  set(file: File) { _file = file; },
  get() { return _file; },
};
