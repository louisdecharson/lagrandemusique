// Copyright (C) 2017 Louis de Charsonville
// This program is free software: you can redistribute it and/or modify
// it under the terms of the MIT License

var express = require('express'),
    path = require('path'),
    tumblr = require('tumblr.js'),
    bodyParser = require('body-parser'),
    fs = require('fs');
 
require('dotenv').config({path:path.join(__dirname,'/.env')});
const app = express();
const blog = "lagrandemusique.tumblr.com";
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
function writeSongs(songs,callback) {
    fs.writeFile('./public/json/songs.json', JSON.stringify(songs), function (err) {
        if (err) {
            callback(new Error(err));
        } else {
            callback(null);
        }
    });
}
const client = tumblr.createClient({
    consumer_key: process.env.TUMBLR_CONSUMER_KEY
});

function downloadSongs(songs,callback) {
    songs = JSON.parse(songs);
    console.log('Download all the songs');
    var totalPosts;
    var offset = 0;
    var onComplete = function(remainingSongs,previousOffset) {
        console.log("REMAINING SONGS: " + remainingSongs);
        if (remainingSongs === 0) {
            callback(false,songs);
        } else {
            download(previousOffset+50);
        }
    }; 
    var download = function (offset) {
        console.log('============================');
        client.blogPosts(blog,{ type: 'video', limit: 1000, offset: offset.toString()},function(err,data) {
            if (err) {
                console.log('ERROR with Tumblr API. Message:' + data.meta.msg);
                callback(new Error(err));
            } else {
                totalPosts = data.total_posts;
                var posts = data.posts;
                var postsToGo = posts.length;
                console.log('Songs to be downloaded: ' + postsToGo);
                if (postsToGo === 0) {
                    onComplete(totalPosts-offset-posts.length,offset);
                } else {
                    posts.forEach(function(post) {
                        try {
                            var song = {
                                "title": post.summary,
                                "id": post.video.youtube.video_id
                            };
                            songs['Songs'].push(song);
                        }
                        catch(error) {
                            console.log('ERROR | ' + postsToGo + '. ' + error);
                        }
                        console.log('Song: ' + postsToGo + '/' + posts.length);
                        if (--postsToGo === 0) {
                            onComplete(totalPosts-offset-posts.length,offset);
                        }
                    });
                }
            } 
        });
    };
    download(offset);
}


// =============================================================================

app.get('/',function(req,res) {
    res.render('index',{songs:songsList['Songs']});
});

app.get('/dl_songs',function(req,res) {
    downloadSongs('{"Songs":[]}',function(error,songs) {
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
    // getAllSongs(tumblrUrl,'{"Songs":[]}',function(error,songs) {
    //     if (!error) {
    //         writeSongs(songs,function(err) {
    //             if (!err) {
    //                 res.send('Songs successfully loaded');
    //             } else {
    //                 res.status(500).send(err.message);
    //             }
    //         });
    //     } else {
    //         res.status(500).send(error.message);
    //     } 
    // });
// });
