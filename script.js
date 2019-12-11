"use strict";
const mloader = document.getElementById("mloader");
const toblur = document.getElementById("toblur");
const searchresults = document.getElementById("sdiv");
const sloader = document.getElementById("sloader");
const dialog = document.getElementById("dialog");
const dvraw = document.getElementById("dvraw");
const dcontent = document.getElementById("dcontent");
const statusbox = document.getElementById("status");
const settings = document.getElementById("settings");

function proxyUrl(url) {
  return "/proxy?url=" + encodeURIComponent(url);
}

var storage;
var storageav = false;
refreshStatus();
function refreshStatus() {
  try {
    storage = window.localStorage;
    var test = "__test__";
    storage.setItem(test, test);
    storage.removeItem(test);
    storageav = true;
  } catch (err) {
    storageav = false;
  }
  statusbox.innerHTML = ((storageav) ? (Math.max(0, storage.length - 1) + " Lehrer im Cache.") : ("Cache nicht verfügbar."));
}

fadeIn(mloader);
if (storageav && storage.getItem("list")) {
  statusbox.innerHTML += "<br/>Liste vom Cache geladen.";
  getBulmePage(function(data) {
    handleList(data, getList(data));
  });
} else {
  getBulmePage(function(data) {
    handleList(data, getList(data));
  });
}

function getBulmePage(callback) {
  const xmlreq = new XMLHttpRequest();
  xmlreq.addEventListener("load", function() {
    if (storageav) storage.setItem("list", this.responseText);
    callback(this.responseText);
  });
  xmlreq.addEventListener("error", function() {
    fadeOut(mloader);
    dvraw.style.display = "none";
    appendTextElem(dcontent, "h2", "Fehler beim Aufrufen der Bulme Website.");
    fadeIn(dialog);
  });
  xmlreq.open("GET", proxyUrl("https://www.bulme.at/bulme258/index.php/schule/lehrkoerper/lehrerinn"));
  xmlreq.send();
}

function getList(data) {
  var teacherreg = /<div kz="(.*?)">(.*?)<\/div>/g;
  var teacherlist = [];
  var tempresult;
  while ((tempresult = teacherreg.exec(data)) !== null) {
    teacherlist.push({
      kz: tempresult[1],
      name: tempresult[2]
    });
  }
  return teacherlist;
}

function handleList(data, teacherlist) {
  fadeOut(mloader);
  fadeIn(document.getElementById("main"));

  var tvar = data.match(/teacherVar = ([0-9]+)/)[1];

  document.getElementById("search").addEventListener("input", function() {
    const searchVal = this.value.toLowerCase();
    searchresults.innerHTML = "";
    for (var i = 0; i < teacherlist.length ; i++){
      if (teacherlist[i].kz.includes(searchVal) || teacherlist[i].name.toLowerCase().includes(searchVal)){
        var className = teacherlist[i].kz === searchVal ? "btn btn-light btnMatch" : "btn btn-light";
        appendTextElem(searchresults, "button", teacherlist[i].kz + " - " + teacherlist[i].name, className, teacherlist[i].kz);
      }
    }
  });

  searchresults.addEventListener("click", function(e) {
    if (e.target.tagName !== "BUTTON") return;
    const kz = e.target.id;
    generateTeacherDetail(kz, false);
  }, false);

  if (location.hash !== "") generateTeacherDetail(location.hash.replace("#", ""), false);
  addEventListener("hashchange", function(e) {
    if (location.hash === "") closeDialog();
    else generateTeacherDetail(location.hash.replace("#", ""), false);
  }, false);

  function generateTeacherDetail(kz, nocache) {
    fadeIn(sloader);
    dcontent.innerHTML = "";
    var img = document.createElement("img");
    img.addEventListener("error", function() {
      appendTextElem(dcontent, "p", "Kein Bild vorhanden oder Offline.");
      img.style.display = "none";
    });
    img.className = "teacherimg";
    img.src = "https://www.bulme.at/bulme258/tools/picture.php?kz=" + kz;
    dcontent.appendChild(img);
    getTeacherDetail(kz, function(details, wascached) {
      if (wascached) appendTextElem(dcontent, "p", "(Aus Cache:)");
      for (var attrname in details.attrs) {
        appendTextElem(dcontent, "p", attrname, "attrname");
        appendTextElem(dcontent, "p", details.attrs[attrname].replace("<br>", " "), "attrvalue");
      }
      fadeOut(sloader);
      dcontent.setAttribute("data-raw", details.raw);
      openDialog();
      history.pushState("", document.title, ".#" + kz);
    }, nocache);
  }

  function getTeacherDetail(kz, callback, nocache = false) {
    const storname = "t_" + kz;
    if (!nocache && storageav && storage.getItem(storname)) {
      callback(JSON.parse(storage.getItem(storname)), true);
      return;
    }
    const detailreq = new XMLHttpRequest();
    detailreq.addEventListener("load", function() {
      var detailreg = /<td class="teacherDetailAttr">(.*?)<\/td><td(?: class="teacherDetailValue")?>(.*?)<\/td>/g;
      var tempresult;
      var details = {raw: this.responseText, attrs: {}};
      while ((tempresult = detailreg.exec(this.responseText)) !== null) {
        if (tempresult[1] === "Sprechstunde:" && tempresult[2] === " ") continue;
        if (tempresult[1] === "&nbsp;" && tempresult[2] === "") continue;
        details.attrs[tempresult[1]] = tempresult[2];
      }
      callback(details, false);
      if (!nocache && storageav) {
        storage.setItem(storname, JSON.stringify(details));
        refreshStatus();
      }
    });
    detailreq.open("GET", proxyUrl("https://www.bulme.at/bulme258/tools/createTeacher3Info.php?kz=" + kz + "&v=" + tvar));
    detailreq.send();
  }
}

function openDialog() {
  fadeIn(dialog);
  toblur.classList.add("dopen");
}

function closeDialog() {
  fadeOut(dialog);
  toblur.classList.remove("dopen");
  if (location.hash !== "") history.pushState("", document.title, ".");
}
document.getElementById("dclose").addEventListener("click", closeDialog, false);

dvraw.addEventListener("click", function() {
  dcontent.innerHTML = dcontent.getAttribute("data-raw");
});

document.getElementById("settingsbtn").addEventListener("click", function() {
  fadeIn(settings);
});

document.getElementById("sclose").addEventListener("click", function() {
  fadeOut(settings);
});

document.getElementById("deletecache").addEventListener("click", function() {
  if (storageav) storage.clear();
  refreshStatus();
});

if (storageav) {
  var comicsans = document.getElementById("comicsans");

  function comicSans() {
    comicsans.innerHTML = localStorage.comicsans === "true" ? "Comic Sans/Comic Neue: Ein" : "Comic Sans/Comic Neue: Aus";
    document.body.style.fontFamily = localStorage.comicsans === "true" ? '"Comic Sans MS", "Comic Neue"' : "";
  }
  comicSans();

  comicsans.addEventListener("click", function() {
    localStorage.comicsans = localStorage.comicsans !== "true";
    comicSans();
  });
}

function appendTextElem(appendto, type, text, classname = false, id = false) {
  var elem = document.createElement(type);
  if (classname) elem.className = classname;
  if (id) elem.id = id;
  elem.appendChild(document.createTextNode(text));
  appendto.appendChild(elem);
}

function fadeIn(loader) {
  loader.style.display = "";
  window.setTimeout(function() {
    loader.style.opacity = 1;
  }, 10);
}

function fadeOut(loader) {
  loader.style.opacity = 0;
  window.setTimeout(function() {
    loader.style.display = "none";
  }, 500);
}