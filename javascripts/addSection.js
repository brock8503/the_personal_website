const SECTIONS = {
  simple: `
      <section id="about" data-editable="" class="simple-text list-group-item">
        <div class="handle"></div>
        <div class="remove" onclick="this.closest('section').toggleAttribute('hidden')"></div>
        <p class="subtitle">
          header
        </p>
        <h1>Title</h1>
        <p>Content</p>
      </section>
      `,
  logos: `
      <section class="logos list-group-item">
        <div class="handle"></div>
        <div class="remove" onclick="this.closest('section').toggleAttribute('hidden')"></div>
        <div data-editable="">
        <ul>
          <li class="logo facebook">
            <a href="#home">facebook</a>
          </li>
        </ul>
      </section>
      `,
  articles: `
    <section id="work" data-editable="" class="articles list-group-item">
      <div class="handle"></div>
      <div class="remove" onclick="this.closest('section').toggleAttribute('hidden')"></div>
      <p class="subtitle">
        articles
      </p>
      <ul>
        <li>
          <a href="#"><b>March 19, 2019</b> Example of an article</a>
        </li>
      </ul>
    </section>
  `
}

// Credits
// https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
function htmlToElement(html) {
  var template = document.createElement('template')
  html = html.trim() // Never return a text node of whitespace as the result
  template.innerHTML = html
  return template.content.firstChild
}

function toggleAdd (el) {
  if(el.querySelector('ul.types').style.display == 'flex') {
    el.querySelector('img.add').style.display = 'block'
    el.querySelector('ul.types').style.display = 'none'
  } else {
    el.querySelector('img.add').style.display = 'none'
    el.querySelector('ul.types').style.display = 'flex'
  }
}

function restartEditor () {
  window.dispatchEvent(new Event('stop-editor'))
  window.dispatchEvent(new Event('start-editor'))
}
