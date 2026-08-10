/* Prototype-only: flips the auth pages between their clean and error renderings. */

document.querySelectorAll("[data-toggle-error]").forEach((button) => {
  button.addEventListener("click", () => {
    const on = button.getAttribute("aria-pressed") !== "true"
    button.setAttribute("aria-pressed", String(on))

    document.querySelectorAll("[data-error-state]").forEach((el) => {
      el.hidden = !on
    })
    document.querySelectorAll("[data-error-state-input]").forEach((el) => {
      el.setAttribute("aria-invalid", String(on))
    })
  })
})
