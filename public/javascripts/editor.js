import Axios from 'https://cdn.skypack.dev/axios'
import Pretty from 'https://cdn.skypack.dev/pretty'
import Sortablejs from 'https://cdn.skypack.dev/sortablejs'
import Feather from 'https://cdn.skypack.dev/feather-icons'
import ContentTools from 'https://cdn.skypack.dev/ContentTools'
import Github from './github.js'

window.addEventListener('load', async function() {
  let params = new URL(location.href).searchParams
  if(!params.has('edit')) return

  let editor = ContentTools.EditorApp.get()
  let home = document.getElementById('home')
  let sections = Array.from(document.getElementsByClassName('list-group-item'))
  let sortable

  editor.init('*[data-editable]', 'data-name')
  editor.addEventListener('start', () => {
    // Allow sorting of sections
    sortable = sortable || Sortablejs.create(home, {
      handle: '.handle'
    /* options */ })

    sortable.options.sort = true
    sections.forEach(x => x.classList.toggle('draggable'))
    document.querySelector('.add-section')?.toggleAttribute('hidden')
  })

  editor.addEventListener('stop', () => {
    sortable.options.sort = false
    sections.forEach(x => x.classList.toggle('draggable'))
    document.querySelector('.add-section')?.toggleAttribute('hidden')
  })

  editor.addEventListener('save', saveToGithub)

  Feather.replace()

  // Keep ids up-to-date with pulling for now
  // so it is easy to navigate around
  setInterval(() => {
    Array.from(document.querySelectorAll("section .subtitle"))
      .map(x => x.closest("section").id = x.innerHTML)
  }, 500)
})

async function saveToGithub() {
  let button = document.querySelector(".button-login")
  let modal = document.getElementById("myModal")
  modal.style.display = "block"

  button.addEventListener("click", mergeChanges)
}

async function mergeChanges() {
  // Don't save modals to github
  hideModals()

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

function hideModals() {
  let modal = document.getElementById("myModal")
  let editor = document.querySelector('.ct-app')
  modal.style.display = "none"
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
