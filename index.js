// Copyright (C) 2017 Louis de Charsonville
// This program is free software: you can redistribute it and/or modify
// it under the terms of the MIT License

var express = require('express'),
    path = require('path'),
    cheerio = require('cheerio'),
    request = require('request'),
    bodyParser = require('body-parser'),
    fs = require('fs');
 

const app = express();
const tumblrUrl = "http://lagrandemusique.tumblr.com";
const yt = "https://youtube.com/";
const songsList = require('./public/json/songs.json');

// CONFIG
app.set('views',path.join(__dirname,'views'));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public',express.static(path.join(__dirname, 'public')));

var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

// =============================================================================
function getPage(pageUrl,callback){
      request(pageUrl,function(e,r,b) {
          if (r.statusCode >=200 && r.statusCode < 400 && !e) {
              var $ = cheerio.load(b),
                  texte = $('.pagination').text(),
                  nbPages = parseInt(texte.substring(texte.indexOf('1')+4,texte.indexOf('1')+7));
              callback(null,nbPages);
          } else {
              callback(new Error('Unable to fetch Tumblr'));
          }
      });
};
function getSongs(pageNb,callback){
    var arraySongs = [];
    var pageUrl = tumblrUrl + '/page/' + pageNb;
    request(pageUrl,function(e,r,b) {
        if (r.statusCode >=200 && r.statusCode < 400 && !e) {
            var $ = cheerio.load(b),
                posts = $('.post');
            for (var cursor=0; cursor < posts.length; cursor++) {
                try {
                    var post = posts.eq(cursor),
                        embedUrl = post.children('.video').children('iframe').attr('src'),
                        youtubeId = embedUrl.substring(embedUrl.indexOf('embed')+6,embedUrl.indexOf('?')),
                        title =  post.children('.video').children('p').text();
                    var song = {
                        "title": title,
                        "id": youtubeId
                    };
                    arraySongs.push(song);
                }
                catch(error){
                }
                if (cursor+1 === posts.length) {
                    callback(null,arraySongs);
                }
            }
        } else {
            callback(new Error('Unable to fetch Tumblr videos'));
        }
    });  
}
function getAllSongs(url,songs,callback){
    songs = JSON.parse(songs);
    getPage(url,function(error,nbPages) {
        if (!error) {
            var added = 0;
            for (var page=1;page<nbPages;page++){
                getSongs(page,function(err,newSongs){
                    if (!err){
                        songs['Songs'] = songs['Songs'].concat(newSongs);
                        if (++added === nbPages-1) {
                            callback(null,songs);
                        } else {
                            console.log(added);
                        }
                    } else {
                        callback(err);
                        console.log(err);
                        return;
                    }
                });
            }
        } else {
            callback(error);
        }
    });
}

function writeSongs(songs,callback) {
    fs.writeFile('./public/json/songs.json', JSON.stringify(songs), function (err) {
        if (err) {
            callback(new Error(err));
        } else {
            callback(null);
        }
    });
}


// =============================================================================

app.get('/',function(req,res) {
    res.render('index',{songs:songsList['Songs']});
});

app.get('/dl_songs',function(req,res) {
    getAllSongs(tumblrUrl,'{"Songs":[]}',function(error,songs) {
        if (!error) {
            writeSongs(songs,function(err) {
                if (!err) {
                    res.send('Songs successfully loaded');
                } else {
                    res.status(500).send(err.message);
                }
            });
        } else {
            res.status(500).send(error.message);
        } 
    });
});
