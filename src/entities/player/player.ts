import spriteSheetConfig from "../../../assets/spriteSheets/spriteSheet.json";
import Entity from "../entity";
import MainScene from "../../scenes/mainScene";
import State from "./playerStates/playerState";
import IdlePlayerState from "./playerStates/idlePlayerState";
import PlayerCommands from "./playerCommands";
import DiePLayerState from "./playerStates/diePlayerState";
import PlayerShot from "./playerShot";

export default class Player extends Entity {

    cursors: Phaser.Input.Keyboard.CursorKeys;
    jumpDelay = 200;
    lastJumpTime = 0;
    currentState: State;
    dying = false;
    isDead = false;
    hitSoundAvailable = true;
    canJump = true;
    _health = 3;
    maxHealth = 3;
    shotGroup: Phaser.GameObjects.Group = null;
    score = 0;

    get health() {
        return this._health;
    }

    set health(value) {
        this._health = value;
        if (this._health <= 0) this.onDying();
    }

    constructor(scene: MainScene, x, y, key) {
        super(scene, x, y, key, "Player");

        this.setSize(10, 15).setOffset(3, 1);
        this.setData("speed", 140);
        this.setData("isDead", false);

        this.cursors = this.scene.input.keyboard.createCursorKeys();

        // Animations management
        this.createAnimations();

        this.shotGroup = this.scene.add.group();

        this.currentState = new IdlePlayerState(this);
    }

    update(time: number) {
        if (this.dying) this.onDying();

        this.currentState.update(this.handleUserInput(this.cursors), time);

        if (this.isOutOfBounds()) this.onDead();
    }

    jump(time) {
        if (time - this.lastJumpTime > this.jumpDelay) {
            this.setVelocityY(-200);
            this.scene.sound.play("playerJump", { detune: Math.random() * 50 - 25 });
            this.lastJumpTime = time;
            return true;
        } else {
            return false;
        }
    }

    setCurrentState(state: State): any {
        this.currentState = state;
    }

    onHit() {
        this.scene.cameras.main.shake(100, 0.001);
        if (this.hitSoundAvailable) {
            this.scene.sound.play("playerHit", { volume: 0.85 });
            this.hitSoundAvailable = false;
        }
        this.scene.time.addEvent({
            callback: () => this.hitSoundAvailable = true,
            delay: 1000
        });
        this.health--;
        if (this.health > 0) {
            this.scene.tweens.add({
                targets: this,
                duration: 100,
                alpha: 0,
                onComplete() {
                    this.alpha = 1;
                },
                onCompleteScope: this,
                repeat: 3
            });

        }
    }

    /**
    * @param effect the effect that will (probably) affect the player
    * @returns true if the effect affected the player, false if no effect
    */
    affect(effect): boolean {
        const { health, maxHealth, score } = effect;
        let affected = false;
        if (health) {
            if (health > 0) affected = this.healthUp(health);
        }
        if (score) {
            this.score += score;
            affected = true;
        }
        if (maxHealth) {
            this.updateMaxHealth(maxHealth);
            affected = true;
        }
        return affected;
    }

    attack(): any {
        this.shotGroup.add(new PlayerShot(this.scene as MainScene, this.x, this.y, spriteSheetConfig.name, this));
        this.scene.sound.play("playerAttack", { detune: Math.random() * 50 - 25 });
    }

    onDead(): any {
        this.scene.cameras.main.shake(250, 0.005);
        this.isDead = true;
    }

    private healthUp(health: number): boolean {
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.health + health, this.maxHealth);
            return true;
        } else {
            return false;
        }
    }

    private updateMaxHealth(maxHealthChange) {
        if (maxHealthChange > 0) {
            this.maxHealth += maxHealthChange;
        } else if (maxHealthChange < 0) {
            this.maxHealth += maxHealthChange;
            if (this.health > this.maxHealth) {
                this.health = this.maxHealth;
            }
        }
    }

    private isOutOfBounds(): any {
        return this.x > (<MainScene>this.scene).map.width * (<MainScene>this.scene).map.tileWidth ||
            this.x < 0 ||
            this.y > (<MainScene>this.scene).map.height * (<MainScene>this.scene).map.tileHeight;
    }

    private onDying() {
        // can be killed only one time :) TODO : do better
        if (!this.dying) this.setCurrentState(new DiePLayerState(this));
        this.dying = true;
    }

    private handleUserInput(cursors): PlayerCommands {
        return {
            up: cursors.up.isDown,
            right: cursors.right.isDown,
            left: cursors.left.isDown,
            attack: cursors.space.isDown
        };
    }

    private createAnimations() {
        // Animations
        this.scene.anims.create({
            key: "walk",
            frames: this.scene.anims.generateFrameNumbers(spriteSheetConfig.name, { start: 0, end: 11 }),
            frameRate: 20,
            repeat: -1
        });
        this.scene.anims.create({
            key: "idle",
            frames: this.scene.anims.generateFrameNumbers(spriteSheetConfig.name, { start: 12, end: 13 }),
            frameRate: 2,
            repeat: -1
        });
        this.scene.anims.create({
            key: "jump",
            frames: [{ key: spriteSheetConfig.name, frame: 15 }],
            frameRate: 20
        });
        this.scene.anims.create({
            key: "land",
            frames: [{ key: spriteSheetConfig.name, frame: 14 }],
            frameRate: 20
        });
        this.scene.anims.create({
            key: "attack",
            frames: this.scene.anims.generateFrameNumbers(spriteSheetConfig.name, { start: 20, end: 36 }),
            frameRate: 36,
            repeat: -1
        });
        this.scene.anims.create({
            key: "die",
            frames: this.scene.anims.generateFrameNumbers(spriteSheetConfig.name, { start: 40, end: 50 }),
            frameRate: 24,
            repeat: 0
        });
        this.scene.anims.create({
            key: "playerShot",
            frames: this.scene.anims.generateFrameNumbers(spriteSheetConfig.name, { start: 140, end: 147 }),
            frameRate: 24,
            repeat: -1
        });
        this.scene.anims.create({
            key: "playerShotExplodes",
            frames: this.scene.anims.generateFrameNumbers(spriteSheetConfig.name, { start: 150, end: 163 }),
            frameRate: 50,
        });
    }
}
