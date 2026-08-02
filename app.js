/* Bar Ellington — Theme switching + community signup (real Supabase insert). */

(function () {
  var VALID = ["gatsby", "interstellar", "canvas", "tiki"];
  var root = document.documentElement;
  var buttons = document.querySelectorAll("[data-set-theme]");

  function currentTheme() {
    var t = root.getAttribute("data-theme");
    return VALID.indexOf(t) === -1 ? "gatsby" : t;
  }

  function setTheme(name) {
    if (VALID.indexOf(name) === -1) return;
    root.setAttribute("data-theme", name);
    buttons.forEach(function (btn) {
      btn.setAttribute(
        "aria-pressed",
        btn.getAttribute("data-set-theme") === name ? "true" : "false"
      );
    });
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setTheme(btn.getAttribute("data-set-theme"));
    });
  });

  // Optional deep link: ?theme=interstellar (used for previews/screenshots).
  var param = new URLSearchParams(window.location.search).get("theme");
  if (param) setTheme(param);

  var SUPABASE_URL = "https://kxdpwqijyfitkwvqlyec.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_r9XiLykJFi5zJS4dlUfrFw_GccQSBTS";
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var supabaseClientPromise = null;
  function getSupabaseClient() {
    if (!supabaseClientPromise) {
      supabaseClientPromise = import("https://esm.sh/@supabase/supabase-js@2").then(
        function (mod) {
          return mod.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
        }
      );
    }
    return supabaseClientPromise;
  }

  var form = document.querySelector(".join-form");
  var thanks = document.querySelector(".join-thanks");
  var errorEl = document.querySelector(".join-error");

  if (form && thanks && errorEl) {
    var emailInput = form.querySelector("#join-email");
    var honeypot = form.querySelector("#join-company");
    var submitBtn = form.querySelector("button[type=submit]");

    function showThanks(message) {
      thanks.textContent = message;
      form.hidden = true;
      errorEl.hidden = true;
      thanks.hidden = false;
    }

    function showError(message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorEl.hidden = true;

      var email = emailInput.value.trim().toLowerCase();
      if (!email || !EMAIL_RE.test(email)) {
        showError("Enter a valid email address.");
        emailInput.focus();
        return;
      }

      // Honeypot: bots that fill hidden fields get a silent, fake success.
      if (honeypot && honeypot.value) {
        showThanks("You're on the list. We will pour the first round soon.");
        return;
      }

      submitBtn.disabled = true;

      getSupabaseClient()
        .then(function (supabase) {
          return supabase.from("community_signups").insert({
            email: email,
            source: "marketing-site",
            theme: currentTheme(),
          });
        })
        .then(function (result) {
          if (result.error) throw result.error;
          showThanks("You're on the list. We will pour the first round soon.");
        })
        .catch(function (err) {
          if (err && err.code === "23505") {
            showThanks("You're already on the list — thanks!");
            return;
          }
          submitBtn.disabled = false;
          showError("Something went wrong. Please try again in a moment.");
        });
    });
  }
})();
