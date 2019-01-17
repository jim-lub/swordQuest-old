/* jshint esversion: 6 */
const Characters = (function() {
  const Ctrls = new Controls();

  function create({type, isPlayerControlled, spawnPosition}) {
    let state = {
      type,
      isPlayerControlled: isPlayerControlled || false,
      spawnPosition: {
        x: spawnPosition.x,
        y: spawnPosition.y
      }
    };

    if (state.isPlayerControlled) {
      return Object.assign(state, ...[hasDefaults(state), canRender(state), isHero(state), canIdle(state), canRun(state), canJump(state), canAttack(state)]);
    } else {
      return Object.assign(state, ...[hasDefaults(state), canRender(state), isHellishSmith(state), canIdle(state), canRun(state), canAttack(state)]);
    }
  }


  /********************************************************************************
  * @Defaults
  * @
  ********************************************************************************/
  const hasDefaults = (state) => ({
    id: Utils.randomID(),

    position: new Vector(state.spawnPosition.x, state.spawnPosition.y),
    velocity: new Vector(),
    acceleration: new Vector(),
    verticalAcceleration: new Vector(),

    direction: 'right',
    directionInt: 1,

    collision: new CollisionDetection(),

    animations: Animations.assign(state.type),

    update: (dt) => {
      _updateDirection(state);
      if (!state.isPlayerControlled) state.animations.play(state.currentState, state.direction); // TEMP

      state.transitions[state.currentState].active();

      _updatePhysics(state, dt);
    },

    currentState: 'idle',

    dispatch: (actionName) => {
      const actions = state.transitions[state.currentState];
      const action = state.transitions[state.currentState][actionName];

      if (action) action.apply(state);
    },

    changeStateTo: (transition) => {
      state.currentState = transition;
    },

    applyForce: (vector) => {
      let force = Vector.divide(vector, state.mass);
      state.acceleration.add(force);
    },

    applyVerticalForce: (vector) => {
      let force = Vector.divide(vector, state.mass);
      state.verticalAcceleration.add(force);
    },
  });


  /********************************************************************************
  * @Types
  * @ Hero / HellishSmith / SwordKnight
  ********************************************************************************/
  const isHero = (state) => ({
    health: 1000,
    damage: {
      base: 1,
      criticalHitChance: 5,
      criticalHitDamage: 2.5
    },
    hitbox: {
      width: 20,
      height: 35
    },
    mass: 100,

    transitions: {
      'idle': {
        active() { state.idle(); },
        run() { state.changeStateTo('run'); },
        jump() { state.changeStateTo('jump'); },
        fall() { state.changeStateTo('fall'); }
      },
      'run': {
        active() { state.run(); },
        idle() { state.changeStateTo('idle'); },
        jump() {state.changeStateTo('jump'); },
        fall() { state.changeStateTo('fall'); }
      },
      'jump': {
        active() { state.jump(); },
        fall() { state.changeStateTo('fall'); }
      },
      'fall': {
        active() { state.fall(); },
        idle() { state.changeStateTo('idle'); }
      }
    }
  });

  const isHellishSmith = (state) => ({
    health: 2500,
    damage: {
      base: 2,
      criticalHitChance: 3.5,
      criticalHitDamage: 5
    },
    hitbox: {
      width: 40,
      height: 75
    },
    mass: 1000,

    transitions: {
      'idle': {
        active() { state.idle(); },
        run() { state.changeStateTo('run'); },
        attack() { state.changeStateTo('attack'); }
      },
      'run': {
        active() { state.run(); },
        idle() { state.changeStateTo('idle'); },
        attack() { state.changeStateTo('attack'); }
      },
      'attack': {
        active() { state.attack(); },
        idle() { state.changeStateTo('idle'); },
        run() { state.changeStateTo('run'); }
      }
    }
  });

  const isSwordKnight = (state) => ({
    health: 1500,
    damage: {
      base: 3,
      criticalHitChance: 5.5,
      criticalHitDamage: 4
    },
    hitbox: {
      width: 40,
      height: 65
    },
    mass: 700,

    transitions: {
      'idle': {
        active() { state.idle(); },
        run() { state.changeStateTo('run'); },
        attack() { state.changeStateTo('attack'); }
      },
      'run': {
        active() { state.run(); },
        idle() { state.changeStateTo('idle'); },
        attack() { state.changeStateTo('attack'); }
      },
      'attack': {
        active() { state.attack(); },
        idle() { state.changeStateTo('idle'); },
        run() { state.changeStateTo('run'); }
      }
    }
  });


  /********************************************************************************
  * @Actions
  * @ Idle / Run / Attack / Jump / Fall
  ********************************************************************************/
  const canIdle = (state) => ({
    idle: () => {
      if (state.isPlayerControlled) {

        if (Ctrls.isClicked('leftClick')) {
          state.animations.play('attack', state.direction);
        } else {
          state.animations.play('idle', state.direction);
        }

        if (Ctrls.isPressed('a') || Ctrls.isPressed('d')) state.dispatch('run');
        if (Ctrls.isPressed('space')) state.dispatch('jump');

      } else {

      }
    }
  });

  const canRun = (state) => ({
    run: () => {
      if (state.isPlayerControlled) {

        if (Ctrls.isClicked('leftClick')) {
          state.animations.play('attack_run', state.direction);
        } else {
          state.animations.play('run', state.direction);
        }

        if (Ctrls.isPressed('space')) state.dispatch('jump');

        if (Ctrls.isPressed('a') || Ctrls.isPressed('d')) {
          state.applyForce(new Vector(15000 * state.directionInt, 0));
        } else {
          if (state.velocity.x === 0) state.dispatch('idle');
        }

      } else {

      }
    }
  });

  const canJump = (state) => ({
    jump: () => {
      if (state.isPlayerControlled) {

        if (Ctrls.isClicked('leftClick')) {
          state.animations.play('attack_jump', state.direction);
        } else {
          state.animations.play('jump', state.direction);
        }

        if (state.collision.hit('y')) {
          state.applyVerticalForce(new Vector(0, -60000));
          state.dispatch('fall');
        } else {
          state.dispatch('fall');
        }

      } else {

      }
    },

    fall: () => {
      if (state.isPlayerControlled) {

        if (Ctrls.isClicked('leftClick')) {
          state.animations.play('attack_jump', state.direction);
        } else {
          state.animations.play('fall', state.direction);
        }

        if (!state.collision.hit('y')) {
          if (Ctrls.isPressed('a') || Ctrls.isPressed('d')) state.applyForce(new Vector(15000 * state.directionInt, 0));
        } else {
          state.dispatch('idle');
        }

      } else {

      }
    }
  });

  const canAttack = (state) => ({
    attack: () => {
      console.log('attacking');
      if (state.isPlayerControlled) {

      } else {

      }
    }
  });


  /********************************************************************************
  * @Utility
  * @
  ********************************************************************************/
  function _updateDirection(state) {
    if (state.isPlayerControlled) {
      if (Ctrls.isPressed('a') || Ctrls.isPressed('d')) {
        state.directionInt = (Ctrls.lastKeyPressed('a', 'd')) ? -1 : 1;
        state.direction = (Ctrls.lastKeyPressed('a', 'd')) ? 'left' : 'right';
      }
    } else {
      // let direction = Math.sign(state.position.x - _getPlayerPosition().x);
      let direction = 1;
      state.directionInt = direction;
      state.direction = (direction === 1) ? 'left' : 'right';
    }
  }


  /********************************************************************************
  * @Render
  * @ MOVE TO SEPARATE FILE
  * @ MOVE TO SEPARATE FILE
  * @ MOVE TO SEPARATE FILE
  ********************************************************************************/
  const canRender = (state) => ({
    render: (ctx) => {
      let currentFrame = state.animations.currentData;

      ctx.drawImage(state.animations.currentSprite,
                    currentFrame.sX,
                    currentFrame.sY,
                    currentFrame.sWidth,
                    currentFrame.sHeight,
                    Math.round(Camera.convertXCoord(state.position.x) + currentFrame.offsetX),
                    Math.round(state.position.y + currentFrame.offsetY),
                    currentFrame.sWidth, currentFrame.sHeight);
    }
  });


  /*****************************
  * @Physics
  * @ TEMPORARY FUNCTIONS UNTIL GAMELOOP REBUILD IS COMPLETE
  * @ TEMPORARY FUNCTIONS UNTIL GAMELOOP REBUILD IS COMPLETE
  * @ TEMPORARY FUNCTIONS UNTIL GAMELOOP REBUILD IS COMPLETE
  ******************************/
  const FORCES = {
    epsilon: 0.1,
    gravity: 9.81,
    friction: -0.99,
    drag: -0.05
  };

  function _updatePhysics(state, dt) {
    state.verticalAcceleration.multiply(0.88);

    if (Math.abs(state.verticalAcceleration.y) < FORCES.epsilon) state.verticalAcceleration.y = 0;
    state.acceleration.add(state.verticalAcceleration);

    state.applyForce(_gravity(state));
    state.applyForce(_friction(state));
    state.applyForce(_drag(state));

    state.velocity.add(state.acceleration);

    if (Math.abs(state.velocity.x) < FORCES.epsilon) state.velocity.x = 0;
    if (Math.abs(state.velocity.y) < FORCES.epsilon) state.velocity.y = 0;

    state.collision.update(state.id, state.position, Vector.multiply(state.velocity, dt), state.hitbox.width, state.hitbox.height);

    if (state.collision.hit('y')) state.velocity.set(state.velocity.x, 0);
    if (state.collision.hit('x')) state.velocity.set(0, state.velocity.y);

    state.velocity.multiply(dt);
    state.position.add(state.velocity);
    state.acceleration.multiply(0);
  }

  function _gravity(state) {
    let f = new Vector(0, (FORCES.gravity * state.mass));
    f.multiply(10);
    return f;
  }

  function _friction(state) {
    let f = state.velocity.clone();
    f.normalize();
    f.multiply(FORCES.friction);
    return f;
  }

  function _drag(state) {
    let f = state.velocity.clone();
    let speed = state.velocity.mag();
    f.normalize();
    f.multiply(FORCES.drag * speed * speed);
    return f;
  }


  return { create };
}());
