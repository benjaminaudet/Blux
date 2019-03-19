export default class WinScene extends Phaser.Scene {

    private nextScene = "startMenuScene";

    constructor() {
        super({
            key: "winScene"
        });
    }

    create() {
        this.add
            .bitmapText(
                (<number>this.game.config.width) * 0.5,
                (<number>this.game.config.height) * 0.5,
                "nokia-white",
                "You won !",
                36)
            .setOrigin(0.5, 0.5);

        this.time.addEvent({ delay: 2000, callback: () => this.scene.start(this.nextScene) });
        this.input.keyboard.once("keydown-SPACE", () => this.scene.start(this.nextScene));

        this.sound.play("victory");
    }
}