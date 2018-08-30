//Set the configuration for the game
    var config = {
        type: Phaser.AUTO, //Set whether phaser should use webgl or canvas, auto will autochoose canvas if webgl is not available
        width: 800, //Set the width of the game screen to 800
        height: 600, //Set the height of the game screen to 600
        physics: { //Define the type of physics to be used, there is Arcade Physics, Impact Physics, and Matter.js Physics
            default: 'arcade', //Arcade physics
            arcade: {
                gravity: { y: 300 }, //Set how powerfull gravity is
                debug: true //Set debug mode, true outlines the game bounds
            }
        },
        parent: 'game', //The id of the parent container
        scene: { //Set the preload, create, and update function
            preload: preload,
            create: create,
            update: update
        }
    };

    var player;
    var stars;
    var platforms;
    var bombs;
    var cursors;
    var score = 0;
    var scoreText;
    var game = new Phaser.Game(config); //Initialize the Phaser Game

    /**
     * This functions runs before the game is launched
     * Loads all required assets
     */
    function preload ()
    {
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.spritesheet('dude', 
            'assets/dude.png',
            //{ frameWidth: 32, frameHeight: 48 }
            { frameWidth: 32, frameHeight: 42 } //I edited the sprite to have a smaller hitbox
        );
    }

    /**
     * Adds sprites to the game
     */
    function create ()
    {
        //Create the Sky
        this.add.image(400, 300, 'sky'); //Adds the background image
    
        //Create the ground        
        platforms = this.physics.add.staticGroup(); //Creates a new object group, allows you to control all the objects as a single unit.

        platforms.create(400, 568, 'ground').setScale(2).refreshBody(); //SetScale makes the image bigger by 2, refreshBody is required because we updated a static object
    
        platforms.create(600, 400, 'ground'); //Sets the texture to the 'ground' texture
        platforms.create(50, 250, 'ground');
        platforms.create(750, 220, 'ground');
        
        //Create the stars
        stars = this.physics.add.group({ //Since we are creating a group and not a static group, these objects are dynamic
            key: 'star', //Sets the texture key to be the star image
            repeat: 11, //This 'repeats' the initialization and creates 11 more stars for a total of 12
            setXY: { x: 12, y: 0, stepX: 70 } //Sets the first star to  12, 0, and every start is 70 pixels to the right from the step (82, 0)
        });
        
        //This goes through all the star children and gives them a round bounce value between 0.4 and 1.0
        stars.children.iterate(function (child) {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 1.0));
        });
        
        //Create the player
        player = this.physics.add.sprite(100, 450, 'dude');

        player.setBounce(0.2);
        player.setCollideWorldBounds(true);
        
        //Animate the player
        this.anims.create({
            key: 'left', //The name of the animation
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }), //Use the first 4 frames to move left
            frameRate: 10, //Set the framerate
            repeat: -1 //Tells Phaser to repeat the animation
        });
        
        this.anims.create({
            key: 'turn', //The name of the animation
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20 //Set the framerate
        });
        
        this.anims.create({
            key: 'right', //The name of the animation
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }), //Use the last 4 frames to move right (Starting at index 5)
            frameRate: 10, //Set the framerate
            repeat: -1 //Tells Phaser to repeat the animation
        });
        
        //Create bombs
        bombs = this.physics.add.group();
        
        //Create Scoretext
        scoreText = this.add.text(16, 16, 'Score: ' + score, { fontSize: '32px', fill: '#000' }); //Adds the text to position 16, 16
        
        cursors = this.input.keyboard.createCursorKeys(); //Autocreates left right down up keys
        
        //Add coliders
        this.physics.add.collider(player, platforms); //Adds a collider between the player and any platforms
        this.physics.add.collider(stars, platforms); //Adds a collider between the stars and the platforms
        this.physics.add.collider(bombs, platforms); //Adds a collider between the bombs and the platforms
        
        this.physics.add.overlap(player, stars, collectStar, null, this);//Checks if the player and the stars collide, if they do it calls the collectStar function
        this.physics.add.collider(player, bombs, hitBomb, null, this);//Checks if the player and the bombs collide, calls hitBomb if they do
    }

    /**
     * Adds key listeners like movement to the game
     */
    function update ()
    {
        if (cursors.left.isDown) //If the left key is pressed
        {
            player.setVelocityX(-160); //Set player velocity to 160 going left.
        
            player.anims.play('left', true); //Play the 'left' animation
        }
        else if (cursors.right.isDown)
        {
            player.setVelocityX(160); //Set player velocity to 160 going right.
        
            player.anims.play('right', true);
        }
        else
        {
            player.setVelocityX(0); //Set player velocity to 0
        
            player.anims.play('turn');
        }
        
        if (cursors.up.isDown && player.body.touching.down) //Check if the up key is pressed AND the player is currently on a surface
        {
            player.setVelocityY(-330); //Set player velocity to 330 going up
        }
    }
    
    /**
     * This function is called when the player and a star collide.
     */
    function collectStar (player, star)
    {
        score += 10; //Adds 10 points to the score
        scoreText.setText('Score: ' + score); //Set the text to the new score
        
        star.disableBody(true, true); //Removes the star from the diplay
        
        if (stars.countActive(true) === 0) //If there are no more stars, release a bomb
        {
            stars.children.iterate(function (child) { //Loop through all stars and set their positions to their x, 0 and display them again.
                child.enableBody(true, child.x, 0, true, true);
            });
    
            var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400); //Randomlly Chooses the bombs x position based on where the player currently is
    
            var bomb = bombs.create(x, 16, 'bomb'); //Creates a new bomb
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20); //Randomlly Set the Speed and direction of the bomb
            bomb.allowGravity = false; //The bomb is not affected by gravity.
    
        }
    }
    
    /**
     * This function is called when the player and a bomb collide
     */
    function hitBomb (player, bomb)
    {
        this.physics.pause();
    
        player.setTint(0xff0000);
    
        player.anims.play('turn');
    
        gameOver = true;
    }