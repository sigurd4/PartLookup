function update()
{
    fetchBools((_) => {fetchTags(fetchParts)});
}

var table = document.getElementById("table");
var hideTags = [];
var allTags = [];
var tableContents = [];
var bools = [];
var projBools = [];
var tabindex = 1;
var tagsOfShownParts = [];
var hideBool = {true: [], false: []};
var conflictingTags = [
    ["BJT", "JFET", "MOSFET", "SCR", "UJT", "PUT", "Triac", "Diode"],
    ["BJT", "JFET", "MOSFET", "NPNP", "PNPN", "Diode"],
    ["NPN", "PNP", "N-", "P-", "N+", "P+", "NPNP", "PNPN", "Diode"],
    ["Si", "Ge"],
    ["Ge", "Darlington"],
    ["Darlington", "Diode"]
];
var requiredTags = {
    "NPN": ["BJT"],
    "PNP": ["BJT"],
    "Si": ["BJT", "Diode"],
    "Ge": ["BJT", "Diode"],
    "Darlington": ["BJT"],
    "N-": ["MOSFET", "JFET"],
    "P-": ["MOSFET", "JFET"],
    "N+": ["MOSFET"],
    "P+": ["MOSFET"],
    "Varicap": ["Diode"],
    "Zener": ["Diode"],
    "Schottky": ["Diode"],
    "Avalanche": ["Diode"]
};
var allowEdit = document.getElementById("allowEdit");
var hitCount = document.getElementById("hitCount");
var projNameElement = document.getElementById("projName");
var projName = "";
var enableBoolFilter = [];
var resultq = 5;
var maxresults = resultq;
var hitq = 10;
var maxhits = hitq;
var moreresults = 0;
var morehits = 0;
var partList = [];

function updateProjName(v)
{
    v = v.replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase()).replace("@", "");
    if(projName != v)
    {
        bools = [];
        projName = v;
        update();
    }
    return v;
}

function isProjectActive()
{
    return projName != "";
}

function printPartList()
{
    var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + partList.join("\n"));
  element.setAttribute('download', "partlist");

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function updateHitCount()
{
    if(!isInt(hitCount.value))
        return;
    var n = Math.max(1, parseInt(Number(hitCount.value)));
    maxhits = n*resultq;
    maxresults = n*hitq;
}

function isInt(i)
{
    return !isNaN(i) && parseInt(Number(i)) == i && !isNaN(parseInt(i, 10));
}

function fetchParts()
{
    var sb = searchBar();
    var sbactive = sb != null && document.activeElement == sb;
    var q = sb === null ? "" : sb.value.toUpperCase();
    var t1 = JSON.stringify(getTagsFilter());
    var b1 = JSON.stringify(getBoolFilter());

    var post = () =>
    {
        if(sb != null)
        {
            document.getElementById("sbdiv").appendChild(sb);
            //sb.value = q;
            if(sbactive)
            {
                if(sb.setActive)
                    sb.setActive();
                if(sb.focus)
                    sb.focus();
            }
        }
    }

    httpGet("part.php?t1=" + t1 + "&b1=" + b1 + "&q=" + q + "&proj=" + projName, function(r)
    {
        partList = r.res0;
        q = sb === null ? "" : sb.value.toUpperCase();
        tagsOfShownParts = r.tt.sort();
        var keys = r.res0.concat(r.res1).map(String);
        var l0 = Math.min(r.res0.length, maxhits);
        var l = Math.max(l0, Math.min(l0 + r.res1.length, maxresults));
        morehits = r.res0.length - l0;
        moreresults = keys.length - l - morehits;
        var i = 0;

        var header = ["Part:"];

        if(isProjectActive())
        {
            header[0] = ["<div class=\"projName\">" + projName + "</div> " + header[0]];
        }
        
        bools.forEach(function(b, _)
        {
            var eb = enableBoolFilter[b] == true;
            var bn = ucfirst(b);
            if(bn.includes("@"))
            {
                bn = "<div class=\"projBool\">" + bn.split("@")[0] + ":</div>";
            }
            else
            {
                bn = "<div>" + bn + ":</div>";
            }
            header.push("<input type=\"checkbox\" onchange=\"enableBoolFilter['" + b + "'] = " + !eb + "; update();\" " + (eb ? "checked" : "") + "></input>" + bn);
        });
        header.push("Tags:");

        var subheaderSearch = "";
        subheaderSearch += "<span id=\"sbdiv\">" + (sb === null ? "<input type=\"text\" autocomplete=\"off\" oninput=\"this.value = formatSearch(this.value);\" class=\"searchBar\" id=\"searchBar\" placeholder=\"Part name...\" value=" + q + ">" : "") + "</span>";
        if(allowEdit.checked)
        {
            subheaderSearch += "<button type=\"button\" onclick=\"postNewPart()\" " + (!canPostNewPart() ? "class=\"buttonPressed\"" : "") + ">" + (existsExactHit() ? "&#8788;" : "+") + "</button>";
            if(existsExactHit())
            {
                subheaderSearch += "<button type=\"button\" onclick=\"deletePart()\" " + (!existsExactHit() ? "class=\"buttonPressed\"" : "") + ">x</button>";
            }
        }
        var subheader = [subheaderSearch]
        bools.forEach(function(b, _)
        {
            subheader.push("<div><button type=\"button\" onclick=\"toggleBool(true, '" + b + "')\" " + (hideBool[true][b] ? "class=\"buttonPressed line\"" : "") + ">true</button><button type=\"button\" onclick=\"toggleBool(false, '" + b + "')\"" + (hideBool[false][b] ? "class=\"buttonPressed line\"" : "") + ">false</button></div>");
        });
        var tagListStr = "";
        if(allTags.length > 0)
        {
            tagListStr += "<button type=\"button\" onclick=\"setTags(true)\"" + (getTagsFilter(false).length == 0 ? " class=\"buttonPressed\"" : "") + ">A</button>";
            tagListStr += "<button type=\"button\" onclick=\"setTags(false)\"" + (getTagsFilter(true).length == 0 ? " class=\"buttonPressed\"" : "") + ">x</button>";
        }
        allTags.forEach(function(t, _)
        {
            if(requiredTags[t] != null && requiredTags[t].length > 0)
            {
                var b = false;
                for(const i in requiredTags[t])
                {
                    if(!hideTags[requiredTags[t][i]])
                    {
                        b = true;
                        break;
                    }
                }
                if(!b)
                    return;
            }
            var clss = [];
            if(hideTags[t])
                clss.push("buttonPressed line");
            if(tagsOfShownParts.includes(t))
                clss.push("highlight");
            tagListStr += "<button type=\"button\" onclick=\"toggleTag('" + t + "')\" " + (clss.length > 0 ? "class=\"" + clss.join(" ") + "\"" : "") + ">" + t + "</button>"
        });
        subheader.push("<div>" + tagListStr + "</div>");
        tableContents = [header, subheader];

        var func = function(r2)
        {
            var row = [keys[i]];

            if(keys[i] === q)
            {
                row[0] = "_" + row[0];
            }
            else if(i < l0)
                row[0] = "*" + row[0];

            bools.forEach(function(b, _)
            {
                var vstr = String(r2[b]);
                var oncl = "this.checked = " + vstr + "; return false;";
                if(allowEdit.checked)
                {
                    oncl = "this.checked = " + vstr + "; changeBoolForPart(\'" + keys[i] + "\', \'" + b + "\', " + String(!r2[b]) + "); return false;";
                }

                row.push("<input type=\"checkbox\" " + (r2[b] ? "checked" : "") + " onclick=\"" + oncl + "\" " + (allowEdit.checked ? "" : "readonly") + "></input>");
            });

            row.push(r2.tags.join(", "));

            tableContents.push(row);

            i++
            if(i < l)
            {
                fetchPart(UnicodeEncode(keys[i]), func);
            }
            else
            {
                if(morehits > 0)
                    tableContents.push(["*+ " + morehits + " more..."]);
                if(moreresults > 0)
                    tableContents.push(["+ " + moreresults + " more..."]);
                displayTable(tableContents);
                post();
            }
        }

        if(l > 0)
        {
            fetchPart(UnicodeEncode(keys[i]), func);
        }
        else
        {
            if(moreresults > 0)
                tableContents.push(["+ " + moreresults + " more..."]);
            displayTable(tableContents);
            post();
        }
    });
}

function fetchBools(func)
{
    if(bools.length > 0)
    {
        func();
        return;
    }
    httpGet("part.php?bools&proj=" + projName, function(r)
    {
        bools = r;
        for(var b in bools)
        {
            if(!hideBool[true].includes(b))
                hideBool[true][b] = false;
            if(!hideBool[false].includes(b))
                hideBool[false][b] = false;
        }
        func();
    });
}

function fetchPart(key, func)
{
    httpGet("part.php?key=" + key, func);
}

function fetchTags(func)
{
    if(allTags.length > 0)
    {
        func();
        return;
    }
    httpGet("part.php?tags", function(r)
    {
        allTags = r;
        func();
    });
}

function httpPut(theUrl, func)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            //console.log(xmlHttp.responseText);
            func(JSON.parse(decodeURIComponent(xmlHttp.responseText)));
        }
    };
    xmlHttp.open("PUT", theUrl, true); // false for synchronous request
    xmlHttp.send(null);
}
function httpDelete(theUrl, func)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function()
    {
        if(this.readyState == 4 && this.status == 200)
        {
            //console.log(xmlHttp.responseText);
            func(JSON.parse(decodeURIComponent(xmlHttp.responseText)));
        }
    };
    xmlHttp.open("DELETE", theUrl, true); // false for synchronous request
    xmlHttp.send(null);
}
function httpGet(theUrl, func)
{
    var xmlHttp = new XMLHttpRequest();
    if(func != null)
    {
        xmlHttp.onreadystatechange = function()
        {
            if(this.readyState == 4 && this.status == 200)
            {
                //console.log(xmlHttp.responseText);
                func(JSON.parse(decodeURIComponent(xmlHttp.responseText)));
            }
        };
    }
    xmlHttp.open("GET", theUrl, func != null); // false for synchronous request
    xmlHttp.send();
    if(func == null && xmlHttp.status === 200)
    {
      return xmlHttp.responseText;
    }
}

function displayTable(tableData)
{
    tabindex = 1;
    table.innerHTML = "";
    
    var tableHead = document.createElement('thead');
    var tableBody = document.createElement('tbody');
    var tableHeadDiv = document.createElement('table');

    var th = 0;
    tableData.forEach((rowData) =>
    {
        var tableBodyDiv;

        var row = document.createElement('tr');

        var exactHit = false;

        if(String(rowData[0]).charAt(0) == "_")
        {
            exactHit = true;
        }
        if(exactHit || String(rowData[0]).charAt(0) == "*")
        {
            row.className = "hit";
            rowData[0] = String(rowData[0]).slice(1);
        }

        const headEnd = 1;
        var l = rowData.length;
        rowData.forEach((cellData, i) =>
        {
            var cell = document.createElement(th <= headEnd ? 'th' : 'td');
            cell.innerHTML = cellData;
            var width = 100/l;
            if(th > headEnd)
            {
                cell.tabIndex = tabindex;
                tabindex++;
            }
            if(exactHit)
            {
                cell.classList.add("exactHit");
                exactHit = false;
            }
            cell.style.width = width + "%";
            row.appendChild(cell);
        });

        if(th > headEnd)
        {
            tableBodyDiv = document.createElement('table');
            tableBodyDiv.className = "subTable";
        }

        (th <= headEnd ? tableHeadDiv : tableBodyDiv).appendChild(row);

        if(th > headEnd)
            tableBody.appendChild(tableBodyDiv);
        th++;
    });

    tableHead.appendChild(tableHeadDiv);
    table.appendChild(tableHead);
    table.appendChild(tableBody);
}

function HtmlEncode(s)
{
    var s2 = s.replace(/[^\w]/ug, function(c)
    {
        if(c.charCodeAt(0) < "\u00A0".charCodeAt(0))
            return c;
        return '&#' + c.charCodeAt(0) + ';';
    });
    return s2;
}

function UnicodeEncode(s)
{
    var s2 = s.replace(/[^\w]/ug, function(c)
    {
        if(c.charCodeAt(0) < "\u00A0".charCodeAt(0))
            return c;
        return '\\u' + ("000" + c.charCodeAt(0).toString(16)).substr(-4);
    });
    return s2;
}

function ucfirst(string) 
{
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

setInterval(detectChange, 100);
var lastSearchBarVal = "";
function searchBar()
{
    return document.getElementById("searchBar");
}
var sinceChange = 0;
function detectChange()
{
    var sb = searchBar();
    var searchBarVal = sb === null ? "" : sb.value;
    if(searchBarVal != lastSearchBarVal || sinceChange > 500)
    {
        lastSearchBarVal = searchBarVal;
        sinceChange = 0;
        update();
    }
}
//setTimeout(update, 100000);
update();

function tagsSuggest(i)
{
    fetchTags((_) => {});
    var a = [];
    for(j in tagsOfShownParts)
    {
        var tag = tagsOfShownParts[j];
        if(!tagsOn[i].includes(tag))
            a.push(tag);
    }
    return a;
}

var searchBarTags = [document.getElementById("searchBarTags0"), document.getElementById("searchBarTags1")];

function submitTag(n)
{
    fetchTags(function()
    {
        var val = searchBarTags[n].value;
        var isTag = false;
        var suggestion = tagsSuggest(n);

        for(const i in allTags)
        {
            var tag = allTags[i];
            if(tag.toLowerCase() === val.toLowerCase())
            {
                val = tag;
                isTag = true;
                break;
            }
        }
        if(isTag)
        {
            if((n === 1 || suggestion.includes(val)) && !tagsOn[n].includes(val))
            {
                tagsOn[n].push(val);
                for(const i in tagsElement)
                {
                    if(i != n)
                        removeTag(val, i);
                }
                update();
            }
            searchBarTags[n].value = "";
        }
    });
    return false;
}

function removeTag(tag, i)
{
    if(tagsOn[i].includes(tag))
    {
        for(var j = 0, l = tagsOn[i].length; j < l; j++)
        {
            if(tagsOn[i][j] === tag)
            {
                tagsOn[i].splice(j, 1);
                break;
            }
        }
        update();
    }
}

function toggleBool(v, b)
{
    if(!hideBool[v][b])
    {
        for(var i in hideBool)
        {
            hideBool[i][b] = false;
        }
    }
    hideBool[v][b] = !hideBool[v][b];
    update();
}

function toggleTag(t)
{
    if(hideTags[t] && requiredTags[t] != null && requiredTags[t].length > 0)
    {
        for(const i in requiredTags[t])
        {
            if(!hideTags[requiredTags[t][i]])
            {
                hideTags[t] = false;
                update();
                return;
            }
        }
    }
    else
    {
        hideTags[t] = !hideTags[t];
        if(hideTags[t])
        {
            for(const i in allTags)
            {
                var t0 = allTags[i];
                if(!hideTags[t0] && requiredTags[t0] != null && requiredTags[t0].length > 0)
                {
                    hideTags[t0] = true;
                    for(const j in requiredTags[t0])
                    {
                        if(!hideTags[requiredTags[t0][j]])
                        {
                            hideTags[t0] = false;
                            break;
                        }
                    }
                }
            }
        }
        update();
    }
}

function getBoolFilter(b, ebm)
{
    var a = [];
    for(var i in bools)
    {
        var b = bools[i];
        var eb = enableBoolFilter[b] == true;
        if(eb || ebm == true)
        {
            if(hideBool[true][b] === true)
            {
                a.push(b);
            }
            else if(hideBool[false][b] === true)
                a.push("!" + b);
        }
    }
    return a;
}

function getTagsFilter(b)
{
    var a = [];
    for(var i in allTags)
    {
        var t = allTags[i];
        if(hideTags[t] === (b != true))
        {
            a.push(t);
        }
    }
    return a;
}

function setTags(b)
{
    var u = b ? getTagsFilter().length > 0 : allTags.length > getTagsFilter().length;
    
    for(var i in allTags)
    {
        var t = allTags[i];

        hideTags[t] = !b;
    }

    if(u)
        update();
}

function existsExactHit()
{
    var sb = searchBar();
    if(sb === null || sb.value.length === 0)
        return false;
    var g = httpGet("part.php?key=" + sb.value.toUpperCase());
    return !(g === "{}");
}

function canPostNewPart()
{
    var sb = searchBar();
    if(sb === null/* || sb.value.length === 0*/)
        return false;
    if(!existsExactHit())
    {
        for(var i in bools)
        {
            var b = bools[i]
            if((hideBool[true][b] === true) == (hideBool[false][b] === true))
                return false;
        }
    }
    var ts = tagsNotHidden();
    for(const j in conflictingTags)
    {
        var cs = conflictingTags[j];
        var c = 0;
        for(const i in ts)
        {
            var t = ts[i];
            if(cs.includes(t))
                c++;
        }
        if(c > 1)
            return false;
    }
    for(const j in requiredTags)
    {
        if(ts.includes(j))
        {
            var b2 = false;
            for(const i in requiredTags[j])
            {
                if(ts.includes(requiredTags[j][i]))
                {
                    b2 = true;
                    break;
                }
            }
            if(!b2)
                return false;
        }
    }
    return true;
}

function tagsNotHidden()
{
    var ts = [];
    for(const i in allTags)
    {
        var t = allTags[i];
        if(!hideTags[t])
            ts.push(t);
    }
    return ts;
}

function formatSearch(q)
{
    q = q.toUpperCase();
    var legal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890\u0410\u0411\u0412\u0413\u0414\u0415\u0416\u0417\u0418\u0419\u041A\u041B\u041C\u041D\u041E\u041F\u0420\u0421\u0422\u0423\u0424\u0425\u0426\u0427\u0428\u0429\u042A\u042B\u042C\u042D\u042E\u042F'.split('');
    var legalonce = '-/\u00B5'.split('');
    var q2 = "";
    for(var i = 0, l = q.length; i < l; i++)
    {
        var c = q.charAt(i);
        if(legal.includes(c) || ((q2.length == 0 || legal.includes(q2.charAt(q2.length - 1))) && legalonce.includes(c)))
            q2 += c;
    }
    return q2;
}

function changeBoolForPart(key, boolname, b)
{
    var o = {};
    o[boolname] = b;
    var val = JSON.stringify(o);
    httpPut("part.php?key=" + key + "&val=" + val, (r) =>
    {
        update();
        return r;
    });
}

function postNewPart()
{
    if(!canPostNewPart())
        return;
    var sb = searchBar();
    if(sb == null || sb.value.length == 0)
        return;
    var key = sb.value.toUpperCase();
    var o = {tags: []};
    var t1 = getTagsFilter(false);
    var b1 = getBoolFilter(false, true);
    for(var i in allTags)
    {
        if(!t1.includes(allTags[i]))
            o.tags.push(allTags[i].replace("+", "%2B"));
    }
    for(var i in bools)
    {
        if(b1.includes(bools[i]))
        {
            if(!b1.includes("!" + bools[i]))
                o[bools[i]] = false;
        }
        else
        {
            if(b1.includes("!" + bools[i]))
                o[bools[i]] = true;
        }
    }
    var val = JSON.stringify(o);
    httpPut("part.php?key=" + key + "&val=" + val, (r) =>
    {
        update();
        return r;
    });
}

function deletePart()
{
    var sb = searchBar();
    if(sb == null || sb.length == 0)
        return;
    if(existsExactHit())
    {
        var key = sb.value.toUpperCase();
        httpDelete("part.php?key=" + key, (r) =>
        {
            update();
            return r;
        });
    }
}