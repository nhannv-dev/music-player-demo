const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const PlAYER_STORAGE_KEY = "MUSIC_PLAYER";

const player = $(".player");
const cd = $(".cd");
const heading = $("header h2");
const cdThumb = $(".cd-thumb");
const audio = $("#audio");
const playBtn = $(".btn-toggle-play");
const progress = $("#progress");
const prevBtn = $(".btn-prev");
const nextBtn = $(".btn-next");
const randomBtn = $(".btn-random");
const repeatBtn = $(".btn-repeat");
const playlist = $(".playlist");
const contextMenu = $(".context");
const contextItemUpdate = $(".context_item.update");
const contextItemCopy = $(".context_item.copy-link");
const contextItemDelete = $(".context_item.delete");
const contextItemAdd = $(".context_item.add");
const modalContainer = $("#modal-container");
const modalSubmit = $(".modal-footer .submit");
const inValidForm = $(".invalid-feedback");

const app = {
    currentIndex: 0,
    isPlaying: false,
    isRandom: false,
    isRepeat: false,
    songs: [],
    config: {},
    // (1/2) Uncomment the line below to use localStorage
    config: JSON.parse(localStorage.getItem(PlAYER_STORAGE_KEY)) || {},
    setConfig: function (key, value) {
        this.config[key] = value;
        // (2/2) Uncomment the line below to use localStorage
        localStorage.setItem(PlAYER_STORAGE_KEY, JSON.stringify(this.config));
    },
    getSongs: async () => {
        let r = await fetch('data.json')
        return await r.json()
    },
    loadSongs: async function () {
        const localSongs = JSON.parse(this.config.songs || null)
        this.songs = localSongs || await this.getSongs();
    },
    render: function () {
        const htmls = this.songs.map((song, index) => {
            return `
                        <div class="song ${
                          index === this.currentIndex ? "active" : ""
                        }" data-index="${index}">
                            <div class="thumb"
                                style="background-image: url('${song.image}')">
                            </div>
                            <div class="body">
                                <h3 class="title">${song.name}</h3>
                                <p class="author">${song.singer}</p>
                            </div>
                            <div class="option">
                                <i class="fas fa-ellipsis-h"></i>
                            </div>
                        </div>
                    `;
        });
        playlist.innerHTML = htmls.join("");
    },
    defineProperties: function () {
        Object.defineProperty(this, "currentSong", {
            get: function () {
                return this.songs[this.currentIndex];
            }
        });
    },
    handleEvents: function () {
        //#region 
        const _this = this;
        const cdWidth = cd.offsetWidth;

        // X??? l?? CD quay / d???ng
        // Handle CD spins / stops
        const cdThumbAnimate = cdThumb.animate([{
            transform: "rotate(360deg)"
        }], {
            duration: 10000, // 10 seconds
            iterations: Infinity
        });
        cdThumbAnimate.pause();

        // X??? l?? ph??ng to / thu nh??? CD
        // Handles CD enlargement / reduction
        document.onscroll = function () {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const newCdWidth = cdWidth - scrollTop;

            cd.style.width = newCdWidth > 0 ? newCdWidth + "px" : 0;
            cd.style.opacity = newCdWidth / cdWidth;
        };

        // X??? l?? khi click play
        // Handle when click play
        playBtn.onclick = function () {
            if (_this.isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
        };

        // Khi song ???????c play
        // When the song is played
        audio.onplay = function () {
            _this.isPlaying = true;
            player.classList.add("playing");
            cdThumbAnimate.play();
        };

        // Khi song b??? pause
        // When the song is pause
        audio.onpause = function () {
            _this.isPlaying = false;
            player.classList.remove("playing");
            cdThumbAnimate.pause();
        };

        // Khi ti???n ????? b??i h??t thay ?????i
        // When the song progress changes
        audio.ontimeupdate = function () {
            if (audio.duration) {
                const progressPercent = Math.floor(
                    (audio.currentTime / audio.duration) * 100
                );
                progress.value = progressPercent;
            }
        };

        // X??? l?? khi tua song
        // Handling when seek
        progress.onchange = function (e) {
            const seekTime = (audio.duration / 100) * e.target.value;
            audio.currentTime = seekTime;
        };

        // Khi next song
        // When next song
        nextBtn.onclick = function () {
            if (_this.isRandom) {
                _this.playRandomSong();
            } else {
                _this.nextSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong();
        };

        // Khi prev song
        // When prev song
        prevBtn.onclick = function () {
            if (_this.isRandom) {
                _this.playRandomSong();
            } else {
                _this.prevSong();
            }
            audio.play();
            _this.render();
            _this.scrollToActiveSong();
        };

        // X??? l?? b???t / t???t random song
        // Handling on / off random song
        randomBtn.onclick = function (e) {
            _this.isRandom = !_this.isRandom;
            _this.setConfig("isRandom", _this.isRandom);
            randomBtn.classList.toggle("active", _this.isRandom);
        };

        // X??? l?? l???p l???i m???t song
        // Single-parallel repeat processing
        repeatBtn.onclick = function (e) {
            _this.isRepeat = !_this.isRepeat;
            _this.setConfig("isRepeat", _this.isRepeat);
            repeatBtn.classList.toggle("active", _this.isRepeat);
        };

        // X??? l?? next song khi audio ended
        // Handle next song when audio ended
        audio.onended = function () {
            if (_this.isRepeat) {
                audio.play();
            } else {
                nextBtn.click();
            }
        };

        // L???ng nghe h??nh vi click v??o playlist
        // Listen to playlist clicks
        playlist.onclick = function (e) {
            const songNode = e.target.closest(".song:not(.active)");


            // X??? l?? khi click v??o song option
            // Handle when clicking on the song option
            if (e.target.closest(".option")) {
                _this.showContexMenu(e)
                contextMenu.style.opacity = 1;
                return
            }

            if (songNode) {
                // X??? l?? khi click v??o song
                // Handle when clicking on the song
                if (songNode) {
                    _this.currentIndex = Number(songNode.dataset.index);
                    _this.loadCurrentSong();
                    _this.render();
                    audio.play();
                }
            }
        };
        //#endregion

        // AddEventListener when click out-side the context-menu
        document.addEventListener("click", function (e) {
            if (e.target.closest(".option")) {
                return
            }

            if (contextMenu.matches(':hover') == false) {
                _this.hiddenContextMenu();
            }
        });

        // X??? l?? khi click context item copy
        contextItemCopy.onclick = function () {
            const hostname = document.location.hostname;
            const origin = document.location.origin;
            let url = _this.songs[contextItemCopy.dataset.index].path;

            url = url.includes(hostname) ? url : `${origin}/${url}`;
            navigator.clipboard.writeText(url);

            // ???n contextMenu
            _this.hiddenContextMenu();
        };

        // X??? l?? khi click delete song
        contextItemDelete.onclick = function () {
            const index = contextItemDelete.dataset.index

            // ???n contextMenu
            _this.hiddenContextMenu();

            if (index == _this.currentIndex) {
                return alert('The music is now playing, you cannot delete it.')
            }

            _this.deleteSong(index);
        };

        // Validate form
        document.addEventListener('DOMContentLoaded', function () {
            // Mong mu???n c???a ch??ng ta
            Validator({
                form: '#form-update',
                formGroupSelector: '.form-group',
                errorSelector: '.form-message',
                rules: [
                    Validator.isRequired('#name', `Please provide a value for the song's name`),
                    Validator.isRequired('#singer', `Please provide a value for the song's singer`),
                    Validator.isRequired('#path', `Please provide a value for the song's path`),
                    Validator.isRequired('#image', `Please provide a value for the song's image`),
                    Validator.isURL('#path'),
                    Validator.isURL('#image'),
                ],
                onSubmit: function (song) {
                    // Call API
                    console.log(song);
                    const isAdd = modalContainer.classList.contains('add');

                    if (isAdd) {
                        _this.addSong(song, contextItemAdd.dataset.index);
                    } else {
                        _this.updateSong(song, contextItemAdd.dataset.index);
                    }

                    _this.closeModal();
                }
            });
        });

        // X??? l?? khi click add song
        contextItemAdd.onclick = function () {
            // Show model
            modalContainer.removeAttribute('class');
            modalContainer.classList.add('show-modal');
            modalContainer.classList.add('add');
            $('body').classList.add('modal-active');

            // Rename modal title
            $(".modal-title").innerHTML = 'Add new song';

            // ???n contextMenu
            _this.hiddenContextMenu();
        }

        // X??? l?? khi click Update song
        contextItemUpdate.onclick = function () {
            const songUpdate = _this.songs[contextItemUpdate.dataset.index]

            // Show model
            modalContainer.removeAttribute('class');
            modalContainer.classList.add('show-modal');
            modalContainer.classList.add('update');
            $('body').classList.add('modal-active');

            // Set current value of the songs
            document.getElementsByName("name")[0].value = songUpdate.name;
            document.getElementsByName("singer")[0].value = songUpdate.singer;
            document.getElementsByName("path")[0].value = songUpdate.path;
            document.getElementsByName("image")[0].value = songUpdate.image;

            // Rename modal title
            $(".modal-title").innerHTML = songUpdate.name;

            // ???n contextMenu
            _this.hiddenContextMenu();

            // // Validator
            // Validator({
            //     formElement: ""
            // });
        }

        // X??? l?? khi submit click add/update song
        // modalSubmit.onclick = function (e) {
        //     const isAdd = modalContainer.classList.contains('add');
        //     const song = {
        //         name: document.getElementsByName("name")[0].value,
        //         singer: document.getElementsByName("singer")[0].value,
        //         path: document.getElementsByName("path")[0].value,
        //         image: document.getElementsByName("image")[0].value,
        //     }

        //     // Validate the song inputed
        //     let isValid = true;
        //     for (const key in song) {
        //         if (song[key] === "") {
        //             document.getElementsByName(key)[0].focus();
        //             inValidForm.removeAttribute("hidden");
        //             inValidForm.innerHTML = `
        //                 <p>Please provide a value for the song's 
        //                 <strong>${key}</strong></p>`;
        //             isValid = false;
        //             break;
        //         }
        //         inValidForm.innerHTML = "";
        //     }

        //     if (!isValid) return;
        //     if (isAdd) {
        //         _this.addSong(song, contextItemAdd.dataset.index);
        //     } else {
        //         _this.updateSong(song, contextItemAdd.dataset.index);
        //     }

        //     _this.closeModal();
        // }

        // X??? l?? click close modal button
        $('.modal-header .close').onclick = function () {
            _this.closeModal();
        }

    },
    hiddenContextMenu: function () {
        contextMenu.setAttribute("hidden", true);
    },
    scrollToActiveSong: function () {
        setTimeout(() => {
            $(".song.active").scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }, 300);
    },
    loadCurrentSong: function () {
        heading.textContent = this.currentSong.name;
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
        audio.src = this.currentSong.path;
    },
    loadConfig: function () {
        this.isRandom = this.config.isRandom ? this.config.isRandom : this.isRandom;
        this.isRepeat = this.config.isRepeat ? this.config.isRepeat : this.isRepeat;
    },
    nextSong: function () {
        this.currentIndex++;
        if (this.currentIndex >= this.songs.length) {
            this.currentIndex = 0;
        }
        this.loadCurrentSong();
    },
    prevSong: function () {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = this.songs.length - 1;
        }
        this.loadCurrentSong();
    },
    playRandomSong: function () {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.songs.length);
        } while (newIndex === this.currentIndex);

        this.currentIndex = newIndex;
        this.loadCurrentSong();
    },
    showContexMenu: function (e) {
        const top = e.pageY > 500 ? 450 : e.pageY;

        contextMenu.style.top = `${top}px`;
        contextMenu.style.left = `${e.pageX}px`;
        contextMenu.removeAttribute("hidden");
        $$(".context_item").forEach(item => {
            item.dataset.index = e.target.closest('.song').dataset.index;
        });
    },
    deleteSong: function (index) {
        if (this.songs[index]) {
            this.songs.splice(index, 1);
        }

        //Update data json to localStorage
        this.setConfig("songs", JSON.stringify(this.songs));

        // Render playlist
        this.render();
    },
    addSong: function (song, index) {
        this.songs.splice(++index, 0, song);

        //Update data json to localStorage
        this.setConfig("songs", JSON.stringify(this.songs));

        // Render playlist
        this.render();
    },
    updateSong: function (song, index) {
        this.songs.splice(index, 1, song);

        //Update data json to localStorage
        this.setConfig("songs", JSON.stringify(this.songs));

        // Render playlist
        this.render();
    },
    closeModal: function () {
        // modalContainer.classList.remove('show-modal');
        modalContainer.removeAttribute('class');
        modalContainer.classList.add('out');
        $('body').classList.remove('modal-active');
        inValidForm.innerHTML = "";
    },
    start: async function () {
        // X??? l?? load songs t??? json File
        await this.loadSongs();

        // G??n c???u h??nh t??? config v??o ???ng d???ng
        // Assign configuration from config to application
        this.loadConfig();

        // ?????nh ngh??a c??c thu???c t??nh cho object
        // Defines properties for the object
        this.defineProperties();

        // L???ng nghe / x??? l?? c??c s??? ki???n (DOM events)
        // Listening / handling events (DOM events)
        this.handleEvents();

        // T???i th??ng tin b??i h??t ?????u ti??n v??o UI khi ch???y ???ng d???ng
        // Load the first song information into the UI when running the app
        this.loadCurrentSong();

        // Render playlist
        this.render();

        // Hi???n th??? tr???ng th??i ban ?????u c???a button repeat & random
        // Display the initial state of the repeat & random button
        randomBtn.classList.toggle("active", this.isRandom);
        repeatBtn.classList.toggle("active", this.isRepeat);
    }
};

app.start();
