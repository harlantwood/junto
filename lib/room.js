C("Room", ["require", "exports", "module", "RoomTopicView", "ChatView", "VideoView"], function (require, exports, module) {
    
    var RoomTopicView = require("RoomTopicView");
    var ChatView = require("ChatView");
    var VideoView = require("VideoView");

    var room = function(opts) {
      var self = this;

      this.isActiveRoom = false;
      this.socket = opts.socket;
      this.webrtc = opts.webrtc;
      this.roomRef = opts.firebase;
      this.room = opts.room;
      this.config = opts.config;
      this.peopleCount = 0;

      this.topic = new RoomTopicView(this);
      this.roomRef.child('topic').on('value', function(snap) {
        self.setTopic(snap.val());
      });
      $(document).on(RoomTopicView.events.change + '-' + this.room, function(event, topic) {
        self.roomRef.child('topic').set(topic);
      });

      this.$myVideo = opts.$video;
      this.myVideo = opts.myVideoView;

      this.messages = new Backbone.Collection();
      this.currentMapper = new Backbone.Model({ name: opts.username });
      this.chat = new ChatView(this.messages, this.currentMapper, this.room);

      this.videos = {};

      this.init();
    };

    room.prototype.join = function(cb) {
      this.isActiveRoom = true;
      this.isActiveRoom = true;
      this.webrtc.joinRoom(this.room, cb);
    }

    room.prototype.leave = function() {
      for (var id in this.videos) {
        this.removeVideo(id);
      }
      this.isActiveRoom = false;
      this.webrtc.leaveRoom();
    }

    room.prototype.setPeopleCount = function(count) {
      this.peopleCount = count;
    }

    room.prototype.setTopic = function(topic) {
      this.topic.setTopic(topic);
    }

    room.prototype.init = function () {
        var self = this;

        this.roomRef.child('messages').on('child_added', function (snap) {
          self.messages.add(snap.val());
        });

        this.webrtc.webrtc.off('peerStreamAdded');
        this.webrtc.webrtc.off('peerStreamRemoved');
        this.webrtc.on('peerStreamAdded', function (peer) {
          if (self.isActiveRoom) {
              self.addVideo(peer);
          }
        });

        this.webrtc.on('peerStreamRemoved', function (peer) {
          if (self.isActiveRoom) {
              self.removeVideo(peer);
          }
        });

        var sendChatMessage = function (event, data) {
          self.sendChatMessage(data);
        };
        $(document).on(ChatView.events.message + '-' + this.room, sendChatMessage);
      }

      room.prototype.videoAdded = function (callback) {
          this._videoAdded = callback;
      }

      room.prototype.addVideo = function (peer) {
        var
          id = this.webrtc.getDomId(peer),
          video = attachMediaStream(peer.stream);
          v = new VideoView(video, null, id, false, { DOUBLE_CLICK_TOLERANCE: 200 });

        if (this._videoAdded) this._videoAdded(v);
        this.videos[peer.id] = v;
      }

      room.prototype.removeVideo = function (peer) {
          var id = typeof peer == 'string' ? peer : peer.id;
          this.videos[id].remove();
          delete this.videos[id];
      }

      room.prototype.sendChatMessage = function (data) {
          this.roomRef.child('messages').push(data);
      }

    module.e = room;
});