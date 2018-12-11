/* jshint esversion: 6 */
const Enemy = (function() {
  const F = {
    epsilon: 0.1,
    gravity: 9.81,
    friction: -0.99,
    drag: -0.05
  };

  function _gravity(state) {
    let f = new Vector(0, (F.gravity * (state.mass * 12)));
    return f;
  }

  function _friction(state) {
    let f = state.vel.clone();
    f.normalize();
    f.multiply(F.friction);
    return f;
  }

  function _drag(state) {
    let f = state.vel.clone();
    let speed = state.vel.mag();
    f.normalize();
    f.multiply(F.drag * speed * speed);
    return f;
  }

  function _apply(state, v) {
    let f = Vector.divide(v, state.mass);
    state.acc.add(f);
  }

  const init = (state) => {
    const payload = [entity(state), render(state)];

    return Object.assign(state, ...payload);
  };

  const render = (state) => ({
    render: (ctx) => {
      let currentFrame = state.animations.getCurrentFrame();
      ctx.drawImage(currentFrame.sprite,
                    currentFrame.data.sX,
                    currentFrame.data.sY,
                    currentFrame.data.sWidth,
                    currentFrame.data.sHeight,
                    Math.round(-Events.listen('CAMERA_OFFSET_X') + state.pos.x + currentFrame.data.offsetX),
                    Math.round(state.pos.y - 10 + currentFrame.data.offsetY),
                    currentFrame.data.sWidth, currentFrame.data.sHeight);
    }
  });

  const entity = (state) => ({
    pos: new Vector(state.x, state.y),
    vel: new Vector(0, 0),
    acc: new Vector(0, 0),
    collision: new CollisionDetection(),
    animations: new PlayerAnimations(),
    apply: (v) => {
      let f = Vector.divide(v, state.mass);
      state.acc.add(f);
    },
    update: (dt) => {
      _apply(state, _gravity(state));
      _apply(state, _friction(state));
      _apply(state, _drag(state));

      state.vel.add(state.acc);

      if (Math.abs(state.vel.x) < F.epsilon) state.vel.x = 0;
      if (Math.abs(state.vel.y) < F.epsilon) state.vel.y = 0;

      state.collision.update(state.pos, Vector.multiply(state.vel, dt), state.width, state.height);

      if (state.collision.hit('y')) state.vel.set(state.vel.x, 0);
      if (state.collision.hit('x')) state.vel.set(0, state.vel.y);

      state.vel.multiply(dt);
      state.pos.add(state.vel);
      state.acc.multiply(0);
    }
  });

  return {
    init
  };
}());
