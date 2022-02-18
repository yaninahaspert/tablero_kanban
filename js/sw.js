self.addEventListener("install", evt => {
    console.log("instanlado el service worker")
    console.log(evt)
})
self.addEventListener("activate", evt => {
    console.log("service worker activado")
    console.log(evt)})
self.addEventListener("fetch", evt => {

    console.log(evt)})