/**
 * Find the Print this page button and trigger the print
 */
document.querySelectorAll<HTMLButtonElement>('.print-link').forEach((printButton) => {
  printButton.addEventListener('click', () => {
    window.print();
  });
});