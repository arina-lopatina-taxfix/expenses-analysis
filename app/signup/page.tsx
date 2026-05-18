"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { track } from "@vercel/analytics";
import { usePageFlag } from "@/lib/usePageFlag";

const BREVO_FORM_HTML = `
<div class="sib-form" style="text-align:center; background-color:transparent;">
  <div id="sib-form-container" class="sib-form-container">
    <div id="error-message" class="sib-form-message-panel" style="font-family:Helvetica, sans-serif; font-size:16px; text-align:left; color:#661d1d; background-color:#ffeded; border-color:#ff4949; border-radius:3px; max-width:540px;">
      <div class="sib-form-message-panel__text sib-form-message-panel__text--center">
        <svg viewBox="0 0 512 512" class="sib-icon sib-notification__icon">
          <path d="M256 40c118.621 0 216 96.075 216 216 0 119.291-96.61 216-216 216-119.244 0-216-96.562-216-216 0-119.203 96.602-216 216-216m0-32C119.043 8 8 119.083 8 256c0 136.997 111.043 248 248 248s248-111.003 248-248C504 119.083 392.957 8 256 8zm-11.49 120h22.979c6.823 0 12.274 5.682 11.99 12.5l-7 168c-.268 6.428-5.556 11.5-11.99 11.5h-8.979c-6.433 0-11.722-5.073-11.99-11.5l-7-168c-.283-6.818 5.167-12.5 11.99-12.5zM256 340c-15.464 0-28 12.536-28 28s12.536 28 28 28 28-12.536 28-28-12.536-28-28-28z" />
        </svg>
        <span class="sib-form-message-panel__inner-text">Your subscription could not be saved. Please try again.</span>
      </div>
    </div>
    <div></div>
    <div id="success-message" class="sib-form-message-panel" style="font-family:Helvetica, sans-serif; font-size:16px; text-align:left; color:#085229; background-color:#e7faf0; border-color:#13ce66; border-radius:3px; max-width:540px;">
      <div class="sib-form-message-panel__text sib-form-message-panel__text--center">
        <svg viewBox="0 0 512 512" class="sib-icon sib-notification__icon">
          <path d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 464c-118.664 0-216-96.055-216-216 0-118.663 96.055-216 216-216 118.664 0 216 96.055 216 216 0 118.663-96.055 216-216 216zm141.63-274.961L217.15 376.071c-4.705 4.667-12.303 4.637-16.97-.068l-85.878-86.572c-4.667-4.705-4.637-12.303.068-16.97l8.52-8.451c4.705-4.667 12.303-4.637 16.97.068l68.976 69.533 163.441-162.13c4.705-4.667 12.303-4.637 16.97.068l8.451 8.52c4.668 4.705 4.637 12.303-.068 16.97z" />
        </svg>
        <span class="sib-form-message-panel__inner-text">Your subscription has been successful.</span>
      </div>
    </div>
    <div></div>
    <div id="sib-container" class="sib-container--large sib-container--vertical" style="max-width:540px; text-align:center; background-color:#f9f7f5; border-width:0px; border-style:solid; border-color:#C0CCD9; border-radius:11px; direction:ltr">
      <form id="sib-form" method="POST" action="https://f261eed8.sibforms.com/serve/MUIFAOemvK9thqVxmi_0nOw0h_5iqdlmUB9nsoUk4fCMy5D3pfi-E21RovraavOT_XasAksNSWXqJjgiol5S2aC2Y2tx95jd2ZcWY1nYu7RaVQ9G67bjkJNwtbXkIoLbWLpLba-xwY4FYSWQfGwFqrh9oevNdBU1Fpmxodgb_15a3MeJWxAbEXKXsHamwo8FOboEoR2ebjI_o3b7" data-type="subscription">
        <div style="padding: 8px 0;">
          <div class="sib-form-block" style="font-family:Helvetica, sans-serif; font-size:27px; font-weight:700; text-align:center; color:#3C4858; background-color:transparent;">
            <p>Your tax summary is almost ready</p>
          </div>
        </div>
        <div style="padding: 8px 0;">
          <div class="sib-form-block" style="font-family:Helvetica, sans-serif; font-size:16px; text-align:center; color:#7b8289; background-color:transparent;">
            <div class="sib-text-form-block">
              <p>Enter your details to see where you could claim back expenses and avoid leaving money on the table</p>
            </div>
          </div>
        </div>
        <div style="padding: 8px 0;">
          <div class="sib-input sib-form-block">
            <div class="form__entry entry_block">
              <div class="form__label-row">
                <label class="entry__label" style="font-weight:700; text-align:left; font-family:Helvetica, sans-serif; font-size:16px; color:#3c4858;" for="FIRSTNAME" data-required="*">First name</label>
                <div class="entry__field">
                  <input class="input" maxlength="200" type="text" id="FIRSTNAME" name="FIRSTNAME" autocomplete="off" data-required="true" required />
                </div>
              </div>
              <label class="entry__error entry__error--primary" style="font-family:Helvetica, sans-serif; font-size:16px; text-align:left; color:#661d1d; background-color:#ffeded; border-color:#ff4949; border-radius:3px;"></label>
            </div>
          </div>
        </div>
        <div style="padding: 8px 0;">
          <div class="sib-input sib-form-block">
            <div class="form__entry entry_block">
              <div class="form__label-row">
                <label class="entry__label" style="font-weight:700; text-align:left; font-family:Helvetica, sans-serif; font-size:16px; color:#3c4858;" for="EMAIL" data-required="*">Email</label>
                <div class="entry__field">
                  <input class="input" type="text" id="EMAIL" name="EMAIL" autocomplete="off" value="" data-required="true" required />
                </div>
              </div>
              <label class="entry__error entry__error--primary" style="font-family:Helvetica, sans-serif; font-size:16px; text-align:left; color:#661d1d; background-color:#ffeded; border-color:#ff4949; border-radius:3px;"></label>
            </div>
          </div>
        </div>
        <div style="padding: 8px 0;">
          <div class="sib-optin sib-form-block">
            <div class="form__entry entry_mcq">
              <div class="form__label-row">
                <div class="entry__choice">
                  <label>
                    <input type="checkbox" class="input_replaced" value="1" id="MARKETING_CONSENT" name="MARKETING_CONSENT" checked />
                    <span class="checkbox checkbox_tick_positive"></span>
                    <span style="font-family:Helvetica, sans-serif; font-size:14px; text-align:left; color:#3C4858; background-color:transparent;"><p>I agree to email marketing from Taxfix and accept the data privacy statement.</p></span>
                  </label>
                </div>
              </div>
              <label class="entry__error entry__error--primary" style="font-family:Helvetica, sans-serif; font-size:16px; text-align:left; color:#661d1d; background-color:#ffeded; border-color:#ff4949; border-radius:3px;"></label>
            </div>
          </div>
        </div>
        <div style="padding: 8px 0;">
          <div class="sib-form-block" style="text-align:center">
            <button class="sib-form-block__button sib-form-block__button-with-loader" style="font-family:Helvetica, sans-serif; font-size:16px; font-weight:700; text-align:center; color:#154618; background-color:#a0d766; border-width:0px; border-radius:15px;" form="sib-form" type="submit">
              <svg class="icon clickable__icon progress-indicator__icon sib-hide-loader-icon" viewBox="0 0 512 512">
                <path d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 50.864 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z" />
              </svg>
              Get my tax summary
            </button>
          </div>
        </div>
        <input type="text" name="email_address_check" value="" class="input--hidden" />
        <input type="hidden" name="locale" value="en" />
      </form>
    </div>
  </div>
</div>
`;

export default function SignUpPage() {
  const router = useRouter();
  const pageEnabled = usePageFlag("signup-page");

  useEffect(() => { track("page_viewed", { page: "signup" }); }, []);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://sibforms.com/forms/end-form/build/sib-styles.css";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (!pageEnabled) return;
    const attach = () => {
      const form = document.getElementById("sib-form") as HTMLFormElement | null;
      if (!form) return false;

      form.addEventListener("submit", (e) => {
        const firstName = (document.getElementById("FIRSTNAME") as HTMLInputElement)?.value ?? "";
        const email = (document.getElementById("EMAIL") as HTMLInputElement)?.value ?? "";
        sessionStorage.setItem("userSignup", JSON.stringify({ firstName, email }));

        fetch(form.action, { method: "POST", mode: "no-cors", body: new FormData(form) }).catch(() => {});

        e.preventDefault();
        router.push("/results");
      });
      return true;
    };

    if (!attach()) {
      const t = setTimeout(attach, 300);
      return () => clearTimeout(t);
    }
  }, [pageEnabled, router]);

  if (!pageEnabled) return null;

  return (
    <main className="min-h-screen flex flex-col bg-white" style={{ marginTop: -40 }}>
      <style>{`
        @font-face { font-display: block; font-family: Roboto; src: url(https://assets.brevo.com/font/Roboto/Latin/normal/normal/7529907e9eaf8ebb5220c5f9850e3811.woff2) format("woff2"), url(https://assets.brevo.com/font/Roboto/Latin/normal/normal/25c678feafdc175a70922a116c9be3e7.woff) format("woff") }
        @font-face { font-display: fallback; font-family: Roboto; font-weight: 600; src: url(https://assets.brevo.com/font/Roboto/Latin/medium/normal/6e9caeeafb1f3491be3e32744bc30440.woff2) format("woff2"), url(https://assets.brevo.com/font/Roboto/Latin/medium/normal/71501f0d8d5aa95960f6475d5487d4c2.woff) format("woff") }
        @font-face { font-display: fallback; font-family: Roboto; font-weight: 700; src: url(https://assets.brevo.com/font/Roboto/Latin/bold/normal/3ef7cf158f310cf752d5ad08cd0e7e60.woff2) format("woff2"), url(https://assets.brevo.com/font/Roboto/Latin/bold/normal/ece3a1d82f18b60bcce0211725c476aa.woff) format("woff") }
        :where(.sib-form-message-panel) { display: none; }
        :where(.sib-form-message-panel .sib-notification__icon) { width: 20px; height: 20px; }
        #sib-container input::placeholder { font-family: Helvetica, sans-serif; text-align: left; color: #C0CCDA; }
        #sib-container textarea::placeholder { font-family: Helvetica, sans-serif; text-align: left; color: #C0CCDA; }
        #sib-container a { text-decoration: underline; color: #2BB2FC; }
        #sib-container * { font-family: 'ABC ROM', sans-serif !important; }
        #sib-container .entry__label { color: #000000 !important; }
        #sib-container .input {
          border: 1px solid #96928E !important;
          border-radius: 10px !important;
          height: 50px !important;
          width: 100% !important;
          padding-left: 16px !important;
        }
        #sib-container .sib-form-block__button {
          width: 100% !important;
          height: 50px !important;
          color: #154618 !important;
          border-radius: 10px !important;
        }
        #sib-container .sib-form-block__button .icon {
          width: 20px !important;
          height: 20px !important;
        }
        #sib-container .checkbox_tick_positive {
          border-color: #a0d766 !important;
        }
        #sib-container input.input_replaced:checked ~ .checkbox_tick_positive {
          background-color: #a0d766 !important;
          border-color: #a0d766 !important;
        }
      `}</style>
      <div className="flex flex-1 items-center justify-center px-4">
        <div
          dangerouslySetInnerHTML={{ __html: BREVO_FORM_HTML }}
          className="w-full"
          style={{ maxWidth: 540 }}
        />
      </div>
    </main>
  );
}
