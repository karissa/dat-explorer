var Ractive = require('ractive')
var fs = require('fs')
var data = require('render-data')

var requests = require('./requests')
var tree = require('./components/tree-view.js')

module.exports = function (el, link) {
  if (typeof el === 'string') el = document.querySelector(el)
  Ractive({
    el: el,
    template: fs.readFileSync('./dat.html').toString(),
    data: { link: link },
    onrender: function () {
      var self = this
      self.set('hash', link.replace('dat://', '').replace('dat:', ''))
      var $display = document.querySelector('#display')
      var $overlay = document.querySelector('#overlay')

      self.set('loading', true)
      requests.metadata(link, function (err, resp, entries) {
        if (err) throw err
        self.set('loading', false)
        var fileList = document.getElementById('file-list')
        var browser = tree('/', entries, fileList)
        browser.on('entry', function (entry) {
          if (entry.type === 'file') {
            var file = {
              name: entry.path,
              length: entry.size,
              createReadStream: function () { return requests.data(link, entry.entry) }
            }
            clearMedia()
            data.render(file, $display, function (err, elem) {
              if (err) throw err
              $display.style.display = 'block'
              $overlay.style.display = 'block'
              elem.onclick = clearMedia
              $display.style['background-color'] = elem.tagName === 'IFRAME' ? 'white' : 'black'
            })
          }
        })
      })

      var clearMedia = function () {
        $display.style.display = 'none'
        $overlay.style.display = 'none'
        $display.innerHTML = ''
      }
      self.on('clearMedia', clearMedia)
    }
  })
}
