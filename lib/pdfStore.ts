let _base64: string | null = null;
let _name: string = "tax-return.pdf";

export const pdfStore = {
  set(base64: string, name: string) {
    _base64 = base64;
    _name = name;
  },
  getBase64() { return _base64; },
  getName() { return _name; },
};
