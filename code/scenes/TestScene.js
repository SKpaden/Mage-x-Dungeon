export default class TestScene extends Phaser.Scene {
    constructor() { super({ key: 'test' }); }
    // Load assets:
    preload() {
    }

    create() {
        this.textBox = addTextBox(this, this.scale.width/2, this.scale.height/2, this.scale.width/4,this.scale.height/4);
        //console.log(textBox.node);
        // textBox.setText(textBox.node.innerText + "<p>Test</p>");
        this.textBox.node.innerHTML += '<p>Test</p>';
        logInDiv(this.textBox.node, "Line 1", "blue");
        logInDiv(this.textBox.node, "Line 2", "blue");
        logInDiv(this.textBox.node, "Line 3", "blue");

        function logInDiv(element, text, color){
            element.innerHTML += `<p style="color: red;">` + text + '<span style="color: orange;"> Yellow</span>' + '</p>';
        }

        function addTextBox(scene, x, y, width, height){
            const container = document.createElement('div');
            container.classList.add('log-output');
            container.style.fontSize = '2.5rem;'
            container.style.width = '500px';
            container.style.height = '500px';
            container.style.color = 'white';
            container.style = `width: ${width}px; height: ${height}px; color: white; background-color: blue; overflow-y: auto; padding: 5px;`;
            return scene.add.dom(x,y,container, container.style, "Test Text!");
        
        }

        const phaserEx = this.add.dom(500, 500, 'div', 'background-color: lime; width: 220px; height: 100px; font: 48px Arial', 'Phaser');
        //console.log(phaserEx);
        phaserEx.setText = "New text!";
        this.logContainer = this.add.container(this.scale.width/2, this.scale.height/2);
        this.logContainer.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(0,0,500, 200), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true});
        this.logContainer.setSize(500, 200);
        //this.logContainer.setScrollFactor(0, 20, true);
        this.logText = this.add.text(0, 0, '', {
            fontSize: '14px',
            color: '#e0e0e0',
            // maxLines: 10,
            wordWrap: { width: 400},
            padding: {
                left: 20,
                right: 20,
                top: 20,
                bottom: 20,
            },
            // rtl: true,
            fixedHeight: 200,
            lineSpacing: 4
        });
        this.logContainer.add(this.logText);
        this.logContainer.setInteractive({ useHandCursor: true });
        this.logContainer.on('pointerdown', () => logCombat(this, "Message 1: This is a message 1! It is a message."));
        this.logContainer.on('wheel', function (pointer, dx, dy, dz, event){
            // console.log(pointer);
            // console.log(event);
            // console.log(dx);
            // console.log(dy);
            if (dy > 0)  this.logText.y -=20;
            if (dy < 0) this.logText.y += 20;
        }, this);

        // Optional: semi-transparent bg
        const bg = this.add.rectangle(200, 90, 500, 200, 0xffffff, 0.6);
        this.logContainer.addAt(bg, 0);

        logCombat(this, "Message 1: This is a message 1! It is a message.");
        logCombat(this, "Message 2: This is a message 2! It is a message.");
        logCombat(this, "Message 3: This is a message 3! It is a message.");
        logCombat(this, "Message 4: This is a message 4! It is a message.");

        function logCombat(scene, text, color = '#e0e0e0') {
            // console.log(scene.logText.x);
            // console.log(scene.logText.y);
            // console.log(scene.logText.width);
            // console.log(scene.logText.height);

            const current = scene.logText.text;
            const newLine = `\n${text}`;
            scene.logText.text = (current + newLine).trim();
            scene.logText.setColor(color); // or per-line color with BBCode / rich text later
            //scene.logText.appendText(newLine);

            // Auto-scroll to bottom
            scene.logText.y = -scene.logText.height + 140; // adjust to keep bottom visible
        }

        // Do something on resize ==> put this in config: scale: {
        //     mode: Phaser.Scale.RESIZE,
        //     width: '100%',
        //     height: '100%'
        // },
        this.scale.on('resize', () => {  // works!
            const saveData = this.textBox.node.innerHTML;
            this.textBox.destroy();
            this.textBox = addTextBox(this, this.scale.width/2, this.scale.height/2, this.scale.width/4,this.scale.height/4);
            this.textBox.node.innerHTML = saveData;
            
        });

        // To check if resize works:
        function printDims(scene){
            console.log(scene.scale.width);
            console.log(scene.scale.height);
            console.log("---------------------");
            console.log(scene.textBox.width);
            console.log(scene.textBox.height);
        }
    }

    update() {}
}
