import Axios from 'https://cdn.skypack.dev/axios'
import Pretty from 'https://cdn.skypack.dev/pretty'
import Sortablejs from 'https://cdn.skypack.dev/sortablejs'
import Feather from 'https://cdn.skypack.dev/feather-icons'
import ContentTools from 'https://cdn.skypack.dev/ContentTools'
import Github from './github.js'
import ImageUploader from './imageupload.js'

window.addEventListener('load', init)
window.addEventListener('reload-editor', init)
window.addEventListener('start-editor', ContentTools.EditorApp.get().start.bind(ContentTools.EditorApp.get()))
window.addEventListener('stop-editor', () => {
  ContentTools.EditorApp.get().revert.bind(ContentTools.EditorApp.get())
  ContentTools.EditorApp.get().stop.bind(ContentTools.EditorApp.get())
})

async function init() {
  let params = new URL(location.href).searchParams
  if(!params.has('edit')) return

  ContentTools.IMAGE_UPLOADER = (dialog) => { return new ImageUploader(dialog) }
  let editor = ContentTools.EditorApp.get()
  let home = document.getElementById('home')
  let sections = Array.from(document.getElementsByClassName('list-group-item'))
  let sortable

  editor.init('*[data-editable]', 'data-name')
  editor.addEventListener('start', () => {
    sections = Array.from(document.getElementsByClassName('list-group-item'))
    // Allow sorting of sections
    sortable = sortable || Sortablejs.create(home, {
      handle: '.handle'
    /* options */ })

    sortable.options.sort = true
    sections.forEach(x => x.classList.add('draggable'))
    let add = document.querySelector('.add-section')
    if (add) add.style.display = 'block'
  })

  editor.addEventListener('stop', () => {
    sections = Array.from(document.getElementsByClassName('list-group-item'))
    sortable.options.sort = false
    sections.forEach(x => x.classList.remove('draggable'))
    let add = document.querySelector('.add-section')
    if (add) add.style.display = 'none'
  })

  editor.addEventListener('save', saveToGithub)

  ContentTools.StylePalette.add([
    new ContentTools.Style('Facebook', 'facebook', ['li']),
    new ContentTools.Style('Twitter', 'twitter', ['li']),
    new ContentTools.Style('Instagram', 'instagram', ['li']),
    new ContentTools.Style('Github', 'github', ['li'])
  ]);

  Feather.replace()

  // Keep ids up-to-date with pulling for now
  // so it is easy to navigate around
  setInterval(() => {
    Array.from(document.querySelectorAll("section .subtitle"))
      .map(x => x.closest("section").id = x.innerHTML)
  }, 500)
}

async function saveToGithub() {
  let button = document.querySelector(".button-login")
  let modal = document.getElementById("myModal")
  modal.style.display = "block"

  button.addEventListener("click", mergeChanges)
}

async function mergeChanges() {
  // Don't save modals to github
  hideNoneMergableChanges()

  const username = document.querySelector("#username").value
  const github = await new Github().init({ password: document.getElementById("password").value })

  const lastCommitSha = await github.lastCommit()
  const lastTreeSha = await github.lastTree(lastCommitSha)

  const url = new URL(window.location.href)
  const newPages = await getNewPages()
  const template = await getNewPagesTemplate()
  const files = [
    ...newPages.map(x => ({ filename: x, content: Pretty(template) })),
    {
      filename: `${url.pathname === '/' ? 'index.html': url.pathname}`,
      content: Pretty(document.documentElement.innerHTML),
    }
  ]

  const sha = await github.createTree(files, lastTreeSha)
  const finalSha = await github.createCommit(sha, lastCommitSha)

  github.updateRef(finalSha)
    .then(( response ) => {
      alert("Saved your changes refresh to see them")
    })
    .catch(err => alert(err))
}

function hideNoneMergableChanges() {
  let modal = document.getElementById("myModal")
  let add = document.querySelector(".add-section")
  let editor = document.querySelector('.ct-app')
  modal.style.display = "none"
  add.style.display = "none"
  editor.remove()
}

function getAllPages() {
  // get all a tag's hrefs and return only
  // ones with html tags
  return [...document.querySelectorAll('a')]
    .map(x => x.getAttribute('href'))
    .filter(x => x.includes('.html'))
}

async function getNewPages() {
  return new Promise(async (resolve) => {
    let base = new URL(window.location.href)
    let urls = getAllPages()
    // "GET" urls
    let responses = await Promise
      .all(urls.map(x => Axios.get(new URL(x, base.origin), {validateStatus: () => true})))

    // for 404's add file based on predefined template to createTree
    resolve(responses
      .filter(x => x.status === 404)
      .map(x => new URL(x.request.responseURL).pathname)
    )
  })
}

async function getNewPagesTemplate() {
  return new Promise(async (resolve) => {
    let base = new URL(window.location.href)
    let template = (await Axios.get(new URL('template.html', base.origin))).data
    let file = `
    <html>
      ${document.head.outerHTML}
      <body>
        ${template}
        ${Array.from(document.scripts).map(x => x.outerHTML).join('\n')}
      </body>
    </html>`

    resolve(file)
  })
}
