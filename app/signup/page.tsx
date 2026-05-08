"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { track } from "@vercel/analytics";
import { usePageFlag } from "@/lib/usePageFlag";

const BREVO_FORM_HTML = `
<div id="sib-container" class="sib-container--large sib-container--vertical" style="max-width:540px; text-align:center; background-color:rgba(255,255,255,1); border-width:0px; border-style:solid; border-color:#C0CCD9; border-radius:11px; direction:ltr">
  <form id="sib-form" method="POST" action="https://f261eed8.sibforms.com/serve/MUIFAOemvK9thqVxmi_0nOw0h_5iqdlmUB9nsoUk4fCMy5D3pfi-E21RovraavOT_XasAksNSWXqJjgiol5S2aC2Y2tx95jd2ZcWY1nYu7RaVQ9G67bjkJNwtbXkIoLbWLpLba-xwY4FYSWQfGwFqrh9oevNdBU1Fpmxodgb_15a3MeJWxAbEXKXsHamwo8FOboEoR2ebjI_o3b7" data-type="subscription">
    <div style="padding: 8px 0 0;">
      <div class="sib-form-block" style="font-size:27px; text-align:center; font-weight:700; font-family:Helvetica, sans-serif; color:#000000; background-color:transparent;">
        <p>Your tax summary is almost ready</p>
      </div>
    </div>
    <div style="padding: 4px 0 20px;">
      <div class="sib-form-block" style="font-size:16px; text-align:center; font-family:Helvetica, sans-serif; color:#6B6968; background-color:transparent;">
        <div class="sib-text-form-block">
          <p>Enter your details to see where you could claim back expenses and avoid leaving money on the table</p>
        </div>
      </div>
    </div>
    <div style="padding: 8px 0;">
      <div class="sib-input sib-form-block">
        <div class="form__entry entry_block">
          <div class="form__label-row">
            <label class="entry__label" style="font-weight:700; text-align:left; font-size:16px; font-family:Helvetica, sans-serif; color:#3c4858;" for="FIRSTNAME" data-required="*">First name</label>
            <div class="entry__field">
              <input class="input" maxlength="200" type="text" id="FIRSTNAME" name="FIRSTNAME" autocomplete="off" data-required="true" required />
            </div>
          </div>
          <label class="entry__error entry__error--primary" style="font-size:16px; text-align:left; font-family:Helvetica, sans-serif; color:#661d1d; background-color:#ffeded; border-radius:3px; border-color:#ff4949;"></label>
        </div>
      </div>
    </div>
    <div style="padding: 8px 0;">
      <div class="sib-input sib-form-block">
        <div class="form__entry entry_block">
          <div class="form__label-row">
            <label class="entry__label" style="font-weight:700; text-align:left; font-size:16px; font-family:Helvetica, sans-serif; color:#3c4858;" for="EMAIL" data-required="*">Email</label>
            <div class="entry__field">
              <input class="input" type="text" id="EMAIL" name="EMAIL" autocomplete="off" data-required="true" required />
            </div>
          </div>
          <label class="entry__error entry__error--primary" style="font-size:16px; text-align:left; font-family:Helvetica, sans-serif; color:#661d1d; background-color:#ffeded; border-radius:3px; border-color:#ff4949;"></label>
        </div>
      </div>
    </div>
    <div style="padding: 8px 0;">
      <div class="sib-form-block">
        <div style="display:flex; align-items:flex-start; gap:10px; text-align:left;">
          <input type="checkbox" id="MARKETING_CONSENT" name="MARKETING_CONSENT" required style="margin-top:3px; flex-shrink:0; width:16px; height:16px; accent-color:#a0d766; cursor:pointer;" />
          <label for="MARKETING_CONSENT" style="font-family:Helvetica, sans-serif; font-size:13px; color:#3c4858; line-height:1.4; cursor:pointer;">
            I agree to receive marketing communications from Taxfix about tax tips, product updates and offers. You can unsubscribe at any time.
          </label>
        </div>
      </div>
    </div>
    <div style="padding: 8px 0;">
      <div class="sib-form-block" style="text-align:center">
        <button class="sib-form-block__button sib-form-block__button-with-loader" style="font-size:16px; text-align:center; font-weight:700; font-family:Helvetica, sans-serif; color:#154618; background-color:#a0d766; border-radius:15px; border-width:0px;" form="sib-form" type="submit">
          <svg class="icon clickable__icon progress-indicator__icon sib-hide-loader-icon" viewBox="0 0 512 512">
            <path d="M460.116 373.846l-20.823-12.022c-5.541-3.199-7.54-10.159-4.663-15.874 30.137-59.886 28.343-131.652-5.386-189.946-33.641-58.394-94.896-95.833-161.827-99.676C261.028 55.961 256 50.751 256 44.352V20.309c0-6.904 5.808-12.337 12.703-11.982 83.556 4.306 160.163 50.864 202.11 123.677 42.063 72.696 44.079 162.316 6.031 236.832-3.14 6.148-10.75 8.461-16.728 5.01z" />
          </svg>
          Get my tax summary
        </button>
      </div>
    </div>
    <input type="text" name="email_address_check" value="" class="input--hidden" />
    <input type="hidden" name="locale" value="en" />
    <input type="hidden" name="html_type" value="simple" />
  </form>
</div>
`;

export default function SignUpPage() {
  const router = useRouter();
  const pageEnabled = usePageFlag("signup-page");

  useEffect(() => { track("page_viewed", { page: "signup" }); }, []);

  if (!pageEnabled) return null;

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://sibforms.com/forms/end-form/build/sib-styles.css";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
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
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#f9f7f5" }}>
      <style>{`
        #sib-container * { font-family: 'ABC ROM', sans-serif !important; }
        #sib-container .entry__label { color: #000000 !important; }
        #sib-container .input {
          border: 1px solid #96928E !important;
          border-radius: 15px !important;
          height: 50px !important;
          width: 100% !important;
          padding-left: 16px !important;
        }
        #sib-container .sib-form-block__button {
          width: 100% !important;
          height: 50px !important;
          color: #154618 !important;
        }
        #sib-container .sib-form-block__button .icon {
          width: 20px !important;
          height: 20px !important;
        }
      `}</style>
      <div className="flex flex-1 items-center justify-center px-4 py-[50px]">
        <div
          dangerouslySetInnerHTML={{ __html: BREVO_FORM_HTML }}
          className="w-full"
          style={{ maxWidth: 540 }}
        />
      </div>
      <Script
        src="https://sibforms.com/forms/end-form/build/main.js"
        strategy="lazyOnload"
      />
    </main>
  );
}
