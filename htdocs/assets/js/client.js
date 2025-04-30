$(function () {
    /**
     *
     *
     */
    const socket = io.connect('https://www.host-x.de:3000');

    /**
     *
     * User joined a room
     *
     */
    socket.on('userJoin', function (msg) {
        if (window.localStorage.getItem('usr') !== null && window.localStorage.getItem('room') !== null) {
            socket.emit('send-user-and-room-name', { username: window.localStorage.getItem('usr'), room: window.localStorage.getItem('room') }); // send username and room to server
        }
    });

    /**
     *
     * get users (for operators)
     *
     */
    socket.on('roomUsers', ({ room, users }) => {
        outputRoomName(room);
        outputUsers(users);
    });

    /**
     *
     * Show message from server
     *
     */
    socket.on('message', (message) => {
        outputMessage(message);

        //Play Sound
        var obj = document.createElement('audio');
        obj.src = './assets/audio/beep.mp3';
        obj.play();

        /**
         * Scroll to bottom
         */
        const chatContainer = document.querySelector('.chat-messages-container');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        const chatContainerOperator = document.querySelector('.chat-messages-operator-container');
        if (chatContainerOperator) {
            chatContainerOperator.scrollTop = chatContainerOperator.scrollHeight;
        }
    });

    /**
     *
     * Send a new message (Clients and Operators use this function)
     * Todo: Should be devided into two functions in two separate files
     *
     */
    $('#bwChatSystemClient, #bwChatSystemOperator').on('keydown', function (e) {
        /**
         *
         *
         */
        if (e.key === 'Enter') {
            e.preventDefault();

            /**
             * Vars
             */
            let ReceiversSocketId = $('#ReceiversSocketId').val();
            let path = window.location.pathname;
            let page = path.split('/').pop();

            if (page == 'chatclient.html') {
                ReceiversSocketId = '';
            }

            if (ReceiversSocketId == '' && page == 'operator.html') {
                alert('Please choose a user');
                return;
            }

            if ($('#msgOperator').val() == '') {
                if (page == 'operator.html') {
                    alert('Message can not be empty');
                }
                return;
            }
            if ($('#msg').val() == '') {
                return;
            }

            // Emit Message
            if (page == 'operator.html') {
                socket.emit('ChatMessageOneToOne', { msg: $('#msgOperator').val(), ReceiversSocketId: ReceiversSocketId });
                $('#msgOperator').val('');
                $('#msgOperator').attr('placeholder', '');
            } else {
                socket.emit('ChatMessageOneToOne', { msg: $('#msg').val(), ReceiversSocketId: ReceiversSocketId });
                $('#msg').val('');
                $('#msg').attr('placeholder', '');
            }
        }
    });

    /**
     *
     * Fade out all for non logged in users (anonymous)
     *
     */
    if (window.localStorage.getItem('usr') === null) {
        /**
         *
         */
        $('#bwChatSystemClient').fadeOut();
        $('#OperatorContainer').fadeOut();
        $('.chat-messages-container').fadeOut();
        $('#logincontainer').fadeIn();
    }

    $('#logincontainer').submit(function (e) {
        e.preventDefault();
        /**
         *
         */
        let usr = $('#usr').val();
        let room = $('#room').val();

        /**
         *
         */
        window.localStorage.setItem('usr', usr);
        window.localStorage.setItem('room', room);

        /**
         *
         */
        $('#logincontainer').fadeOut();
        $('#OperatorContainer').fadeIn();
        $('#bwChatSystemClient').fadeIn();
        $('.chat-messages-container').fadeIn();
        /**
         *
         */
        location.reload(); // reload page
        document.getElementById('msg').focus();
    });
});

/**
 *
 * FUNKTIONEN
 *
 */
// Add room name to DOM
function outputRoomName(room) {
    document.getElementById('room-name').innerText = room;
}

/**
 *
 * Add users to DOM
 *
 */
function outputUsers(users) {
    /** */
    $('#users').html('');

    users.forEach((user) => {
        if (user.username != 'Nick') {
            $('#users').append(
                $('<li id="' + user.id + '" style="cursor:pointer" title="' + user.id + '">')
                    .text(user.username)
                    .hide()
                    .fadeIn()
            );
        }
    });
}

/**
 *
 * Output message to DOM
 *
 */
//const chatForm = document.getElementById('chat-form');
//const chatMessages = document.querySelector('.chat-messages-container');

function outputMessage(message) {
    /**
     *
     *
     */
    let class_message = '';

    if (message.username == 'ChatBot') {
        class_message = 'operator avatarChatClient';
    } else if (message.username == 'Nick') {
        class_message = 'operator avatarOperator';
    }

    /**
     *
     */
    $('.chat-messages-container').append(
        $('<div class="bubble ' + class_message + '"><p class="meta">' + message.username + '<span> ' + message.time + '</span></p><p class="text">' + message.text + '</p></div>')
            .hide()
            .fadeIn()
    );
}
