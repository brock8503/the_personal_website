// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  let modal = document.getElementById("myModal");
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
