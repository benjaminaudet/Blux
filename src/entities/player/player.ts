import spriteSheetConfig from "../../../assets/spriteSheets/spriteSheet.json";
import Entity from "../entity";
import MainScene from "../../scenes/mainScene";
import State from "./playerStates/playerState";
import IdlePlayerState from "./playerStates/idlePlayerState";
import PlayerCommands from "./playerCommands";
import DiePLayerState from "./playerStates/diePlayerState";
import PlayerShot from "./playerShot";

export default class Player extends Entity {

    cursors: Phaser.Input.Keyboard.CursorKeys = null;

    currentState: State = null;

    shotGroup: Phaser.GameObjects.Group = null;
    shotPower = 1;

    speed = 140;

    jumpPower = 200;
    jumpDelay = 200;
    lastJumpTime = 0;

    dying = false;
    isDead = false;
    health = 3;
    maxHealth = 3;

    invincible = false;
    hitLimitTime = 400;

    score = 0;

    constructor(scene: MainScene, x, y, key) {
        super(scene, x, y, key, "Player");

        this.setSize(10, 15).setOffset(3, 1).setDragX(100);

        this.cursors = this.scene.input.keyboard.createCursorKeys();

        this.createAnimations();
        this.shotGroup = this.scene.add.group();
        this.currentState = new IdlePlayerState(this);
    }

    update(time: number) {
        if (this.isOutOfBounds()) {
            this.onDead();
        } else {
            if (this.health <= 0) {
                this.onDying();
            }
            this.currentState.update(this.handleUserInput(this.cursors), time);
        }
    }

    /**
     * Jump if the previous jump was not to close in time
     * @param time the current time
     * @return true if the jump was performed
     */
    jump(time): boolean {
        if (time - this.lastJumpTime > this.jumpDelay) {
            this.setVelocityY(-this.jumpPower);
            this.scene.sound.play("playerJump", { detune: Math.random() * 50 - 25 });
            this.lastJumpTime = time;
            return true;
        } else {
            return false;
        }
    }

    setCurrentState(state: State): void {
        this.currentState = state;
    }

    onHit(power = 1) {
        if (!this.dying && this.affect({ health: -power })) {
            this.scene.cameras.main.shake(100, 0.001);
            this.scene.sound.play("playerHit", { volume: 0.5 });
            if (this.health > 0) {
                this.setInvincibility();
            }
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
            affected = this.updateHealth(health);
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

    private setInvincibility() {
        this.invincible = true;
        const repeatTime = 3;
        this.scene.tweens.add({
            targets: this,
            duration: this.hitLimitTime / repeatTime,
            alpha: 0,
            onComplete() {
                this.invincible = false;
                this.alpha = 1;
            },
            onCompleteScope: this,
            repeat: repeatTime
        });
    }

    /**
     * Update health of the player if possible
     * @param amount the amount to change
     * @return true if health changed
     */
    private updateHealth(amount): boolean {
        if (amount > 0) {
            if (this.health < this.maxHealth) {
                this.health = Math.min(this.health + amount, this.maxHealth);
                return true;
            } else {
                return false;
            }
        } else if (amount < 0) {
            if (!this.invincible) {
                this.health += amount;
                return true;
            } else {
                return false;
            }
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
        if (!this.dying) {
            this.setCurrentState(new DiePLayerState(this));
            this.dying = true;
        }
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