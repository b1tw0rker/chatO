/**
 * Datei: operator.js
 * Socket.IO-Verbindung herstellen
 */
//var socket = io.connect('https://www.host-x.de:3000');
const socket = io({ path: '/socket.io' });

$(function () {
    /**
     * Überprüfe, ob ein Benutzer angemeldet ist
     */
    if (window.localStorage.getItem('operator') === null) {
        /**
         * Benutzer ist nicht angemeldet
         */
        $('#bwChatSystemClient').fadeOut();
        $('#OperatorContainer').fadeOut();
        $('.chat-messages-operator-container').fadeOut();
        $('#logincontainerOperator').fadeIn();
    } else {
        /**
         * Benutzer ist bereits angemeldet
         * Sendet den Operator und Kanalnamen an den Server
         */
        let operator = window.localStorage.getItem('operator');
        let kanal = window.localStorage.getItem('kanal');
        let role = window.localStorage.getItem('role') || 'operator';

        socket.emit('send-user-and-kanal-name', {
            username: operator,
            kanal: kanal,
            role: role,
        });

        $('#logincontainerOperator').fadeOut();
        $('#OperatorContainer').fadeIn();
        $('#bwChatSystemClient').fadeIn();
        $('.chat-messages-operator-container').fadeIn();
    }

    // Typing-Indicator wird dynamisch eingefügt und entfernt, wenn notwendig

    $('#logincontainerOperator').submit(function (e) {
        e.preventDefault();
        /**
         * Daten aus dem Formular extrahieren
         */
        let operator = $('#operator').val();
        let kanal = $('#kanal').val();
        let role = $('#role').val() || 'operator';

        /**
         * Daten im localStorage speichern
         */
        window.localStorage.setItem('operator', operator);
        window.localStorage.setItem('kanal', kanal);
        window.localStorage.setItem('role', role);

        /**
         * Sendet den Operator und Kanalnamen an den Server
         */
        socket.emit('send-user-and-kanal-name', {
            username: operator,
            kanal: kanal,
            role: role,
        });

        /**
         * UI-Elemente ein-/ausblenden
         */
        $('#logincontainerOperator').fadeOut();
        $('#OperatorContainer').fadeIn();
        $('#bwChatSystemClient').fadeIn();
        $('.chat-messages-operator-container').fadeIn();

        document.getElementById('msgOperator').focus();
    });

    /**
     * Auf 'kanalUsers'-Meldung reagieren und Kanal sowie Benutzer aktualisieren
     */
    socket.on('kanalUsers', ({ kanal, users, operators }) => {
        console.log('Kanal und Benutzer empfangen:', kanal, users, operators);
        outputKanalName(kanal);
        outputUsers(users);
        outputOperators(operators);
    });

    /**
     * Auf 'message'-Meldung reagieren und Nachricht anzeigen
     * HINZUGEFÜGT: Event-Handler für empfangene Nachrichten
     */
    socket.on('message', (message) => {
        console.log('Nachricht empfangen:', message);
        outputMessage(message);

        // Sound abspielen
        var obj = document.createElement('audio');
        obj.src = './assets/audio/wa_incoming.mp3';
        obj.play();

        // Nach unten scrollen
        const chatContainerOperator = document.querySelector('.chat-messages-operator-container');
        if (chatContainerOperator) {
            chatContainerOperator.scrollTop = chatContainerOperator.scrollHeight;
        }
    });

    /**
     * Typing indicator - Zeige Schreibindikator, wenn ein Client tippt
     */
    socket.on('typing', function (data) {
        if (data.role !== 'operator') {
            // Entferne vorhandenen Indikator, falls vorhanden
            $('#typing-indicator').remove();

            // Füge den Indikator am Ende des Chat-Containers ein
            $('.chat-messages-operator-container').append('<div class="typing-indicator" id="typing-indicator"><span></span><span></span><span></span></div>');

            // Nach unten scrollen
            const chatContainerOperator = document.querySelector('.chat-messages-operator-container');
            if (chatContainerOperator) {
                chatContainerOperator.scrollTop = chatContainerOperator.scrollHeight;
            }
        }
    });

    /**
     * Typing indicator - Verstecke Schreibindikator, wenn ein Client aufhört zu tippen
     */
    socket.on('stopTyping', function (data) {
        if (data.role !== 'operator') {
            $('#typing-indicator').fadeOut(function () {
                $(this).remove();
            });
        }
    });

    // Tracking-Variable für den Tippstatus
    let isTyping = false;
    let typingTimeout;

    // Erfasse Tastatureingaben im Eingabefeld
    $('#msgOperator').on('input', function () {
        if (!isTyping) {
            isTyping = true;

            // Sende Typing-Event nur, wenn ein Empfänger ausgewählt ist
            let receiverSocketId = $('#ReceiversSocketId').val();
            if (receiverSocketId !== '') {
                socket.emit('typing', {
                    username: window.localStorage.getItem('operator'),
                    role: window.localStorage.getItem('role') || 'operator',
                    receiverSocketId: receiverSocketId,
                });
            }
        }

        // Setze bestehenden Timeout zurück
        clearTimeout(typingTimeout);

        // Setze Timeout, um Typing-Status nach kurzer Inaktivität zurückzusetzen
        typingTimeout = setTimeout(function () {
            isTyping = false;
            let receiverSocketId = $('#ReceiversSocketId').val();
            if (receiverSocketId !== '') {
                socket.emit('stopTyping', {
                    username: window.localStorage.getItem('operator'),
                    role: window.localStorage.getItem('role') || 'operator',
                    receiverSocketId: receiverSocketId,
                });
            }
        }, 1000);
    });

    /**
     * Select a single user from left side
     */
    $('#users').on('click', 'li', function (e) {
        e.preventDefault();

        /**
         * Vars
         */
        let socketid = $(this).attr('id');
        let name = $(this).text();

        /**
         * Ausgewählten Benutzer markieren
         */
        $('#ReceiversSocketId').val(socketid);
        $('#msgOperator').attr('placeholder', 'Deine Nachricht an ' + name);
        $('#users li').removeClass('active');
        $(this).addClass('active');
        $('#operators li').removeClass('active');
    });

    /**
     * Select a single operator from left side
     */
    $('#operators').on('click', 'li', function (e) {
        e.preventDefault();

        /**
         * Vars
         */
        let socketid = $(this).attr('id');
        let name = $(this).text();

        /**
         * Ausgewählten Operator markieren
         */
        $('#ReceiversSocketId').val(socketid);
        $('#msgOperator').attr('placeholder', 'Deine Nachricht an Operator ' + name);
        $('#operators li').removeClass('active');
        $(this).addClass('active');
        $('#users li').removeClass('active');
    });

    /**
     * Play Sound
     */
    socket.on('userRing', function (msg) {
        var obj = document.createElement('audio');
        obj.src = './assets/audio/wa_incoming.mp3';
        obj.play();
    });

    /**
     * Setze beim load the page auf ""
     */
    $('#ReceiversSocketId').val('');

    /**
     * Send a new message (Clients and Operators use this function)
     */
    $('#bwChatSystemOperator').on('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();

            /**
             * Vars
             */
            let ReceiversSocketId = $('#ReceiversSocketId').val();
            let path = window.location.pathname;
            let page = path.split('/').pop();

            if (ReceiversSocketId == '') {
                alert('Please choose a user');
                return;
            }

            if ($('#msgOperator').val() == '') {
                return;
            }

            // Bei Nachrichtenversand Typing-Status sofort beenden
            isTyping = false;
            clearTimeout(typingTimeout);
            socket.emit('stopTyping', {
                username: window.localStorage.getItem('operator'),
                role: window.localStorage.getItem('role') || 'operator',
                receiverSocketId: ReceiversSocketId,
            });

            // Emittiere/Sende Message
            socket.emit('ChatMessageOneToOne', {
                msg: $('#msgOperator').val(),
                ReceiversSocketId: ReceiversSocketId,
                role: window.localStorage.getItem('role') || 'operator',
            });
            $('#msgOperator').val('');
            $('#msgOperator').attr('placeholder', '');
        }
    });
});

/**
 * FUNKTONEN
 */

/**
 * Add kanal name to the left sidebar
 */
function outputKanalName(kanal) {
    console.log('Setze Kanalname:', kanal);
    document.getElementById('kanal-name').innerText = kanal;
}

/**
 * Nachricht im Chat anzeigen
 * HINZUGEFÜGT: Funktion zum Anzeigen von Nachrichten
 */
function outputMessage(message) {
    let class_message = '';
    if (message.username == 'ChatBot') {
        class_message = 'operator avatarChatClient';
    } else if (message.role == 'operator') {
        class_message = 'operator avatarChatOperator';
    } else {
        class_message = 'avatarChatClient';
    }

    $('.chat-messages-operator-container').append(
        $('<div class="bubble ' + class_message + '"><p class="meta">' + message.username + '<span> ' + message.time + '</span></p><p class="text">' + message.text + '</p></div>')
            .hide()
            .fadeIn()
    );
}

/**
 * List Users in Left sidebar
 */
function outputUsers(users) {
    console.log('Aktualisiere Benutzerliste:', users);
    // Benutzerlistenelement leeren
    $('#users').html('');

    // Zugriff auf das DOM nur einmal
    const usersList = $('#users');

    // Aktualisierte Map für aktive Benutzer erstellen
    const newActiveUsers = new Map();

    // Benutzer der Liste hinzufügen (nur Benutzer mit Rolle 'user')
    users.forEach((user) => {
        // Prüfen, ob der Benutzername bereits in der Liste ist
        // Verhindert doppelte Einträge des gleichen Benutzernamens
        const existingUsers = Array.from(newActiveUsers.values());
        if (!existingUsers.some((existingUser) => existingUser.username === user.username)) {
            newActiveUsers.set(user.id, user);

            const li = document.createElement('li');
            li.id = user.id; // Socket-ID als ID für das li-Element
            li.innerHTML = `
                <span class="username">${user.username}</span>
                <a class="chat-link" data-socket-id="${user.id}" href="#">
                    <i class="bi bi-chat-dots-fill"></i>
                </a>
            `;
            usersList.append(li);
        }
    });
}

/**
 * List Operators in Left sidebar
 */
function outputOperators(operators) {
    console.log('Aktualisiere Operatorliste:', operators);
    // Operatorlistenelement leeren
    $('#operators').html('');

    // Zugriff auf das DOM nur einmal
    const operatorsList = $('#operators');

    // Aktualisierte Map für aktive Operatoren erstellen
    const newActiveOperators = new Map();

    // Operatoren der Liste hinzufügen (nur Benutzer mit Rolle 'operator')
    operators.forEach((operator) => {
        // Prüfen, ob der Operatorname bereits in der Liste ist
        // Verhindert doppelte Einträge des gleichen Operatornamens
        const existingOperators = Array.from(newActiveOperators.values());
        if (!existingOperators.some((existingOperator) => existingOperator.username === operator.username)) {
            newActiveOperators.set(operator.id, operator);

            const li = document.createElement('li');
            li.id = operator.id; // Socket-ID als ID für das li-Element
            li.innerHTML = `
                <span class="username">${operator.username}</span>
                <a class="chat-link" data-socket-id="${operator.id}" href="#">
                    <i class="bi bi-chat-dots-fill"></i>
                </a>
            `;
            operatorsList.append(li);
        }
    });
}
