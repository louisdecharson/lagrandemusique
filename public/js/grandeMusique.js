var iconPlay = $('#playIcon');
var iconNext = $('#nextIcon');
var compteur = 0;
var songs = [];
$('.song-title').each(function(it,ind){
    var title = $(this).text(),
        id = $(this).next().find('.song-id').text();
    songs.push({"title":title,"id":id});
});

function toggleButton(play) {
    var glyphicon = play ? "fa-pause" : "fa-play";
    var notGlyph = play ? "fa-play" : "fa-pause";
    iconPlay.addClass(glyphicon);
    iconPlay.removeClass(notGlyph);
}

function getNiceTime(time) {
    var minutes = Math.floor(time / 60),
        seconds = Math.floor(time-minutes*60);
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var myTime = minutes+":"+seconds;
    return myTime;
}

function onYouTubePlayerAPIReady() {
    var player = new YT.Player('embed-player', {
        height:'0',
        width: '0',
        videoId: songs[compteur].id,
        playerVars: {
            'controls' : 0,
            'modestbranding' : 1,
            'rel' : 0,
            'showinfo' : 0
        },
        events: {
            'onReady': onReady,
            'onStateChange': onPlayerStateChange,
            'onError': onError
        }
    });
    function playSong(c) {
        player.loadVideoById(songs[c].id,0,"default");
        $('#song-title').text(songs[c].title);
        var hashid = '#' + songs[c].id;
        $('.song-title').css('font-weight','normal');
        $(hashid).css('font-weight','bold');
    }
    function playSongbyId(id) {
        player.loadVideoById(id,0,"default");
        var hashid = '#' + id;
        $('.song-title').css('font-weight','normal');
        $(hashid).css('font-weight','bold');
        compteur = $(hashid).parent().index();
        console.log('compteur: ',compteur);
        $('#song-title').text($(hashid).text());
    }
    iconPlay.click(function(){
        if (player.getPlayerState() === YT.PlayerState.PLAYING || player.getPlayerState() === YT.PlayerState.BUFFERING) {
            player.pauseVideo();
            toggleButton(false);
        } else {
            player.playVideo();
            toggleButton(true);
        }
    });
    iconNext.click(function(){
        if (compteur < songs.length) {
            compteur ++;
        } else {
            compteur = 0;
        }
        playSong(compteur);
    });
    $('.song-title').click(function(){
        var id = $(this).next().find('.song-id').text();
        playSongbyId(id);
    });
    function onReady(e) {
        $('#song-title').text(songs[compteur].title);
        var id = '#' + songs[compteur].id;
        $(id).css('font-weight','bold');
        $('#table').css('margin-top',$('#my-player').outerHeight()+'px');
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            clearTimeout(mytimer);
            compteur++;
            playSong(compteur);
        } else if (event.data == YT.PlayerState.PLAYING) {
            toggleButton(true);
            mytimer = setInterval(function() {
                $('#table').css('margin-top',$('#my-player').outerHeight()+'px');
                $('#time').text(getNiceTime(player.getCurrentTime())+" / "+getNiceTime(player.getDuration()));
            },1000);
        } else if (event.data == YT.PlayerState.PAUSED) {
            toggleButton(false);
        }
    };
    function onError(e) {
        $('#song-title').text(Error);
        compteur ++;
        playSong(compteur);
    };
};


