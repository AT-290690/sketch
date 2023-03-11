import { VOID } from '../core/tokeniser.js'
import { LZUTF8 } from '../misc/lz-utf8.js'
import Inventory from './Inventory.js'
export const protolessModule = (methods) => {
  const env = Object.create(null)
  for (const method in methods) env[method] = methods[method]
  return env
}

export const LIBRARY = {
  NAME: 'LIBRARY',
  REGEXP: {
    NAME: 'REGEXP',
    make_regexp: (regex) => new RegExp(regex),
    match: (string, regex) => {
      console.log(string, regex)
      return string.match(regex)
    },
    replace: (string, regex) => string.replace(regex),
  },
  STORAGE: {
    NAME: 'STORAGE',
    set_in_storage: (key, value) => sessionStorage.setItem(key, value),
    get_from_storage: (key) => sessionStorage.getItem(key),
    remove_from_storage: (key) => sessionStorage.removeItem(key),
    clear_storage: () => sessionStorage.clear(),
  },
  DATE: {
    NAME: 'DATE',
    format_to_local: (date, format) => date.toLocaleDateString(format),
    make_new_date: () => new Date(),
    make_date: (date) => new Date(date),
    get_hours: (date) => date.getHours(),
    get_minutes: (date) => date.getMinutes(),
    get_seconds: (date) => date.getSeconds(),
    get_time: (date) => date.getTime(),
  },
  COLOR: {
    NAME: 'COLOR',
    make_rgb_color: (r, g, b) => `rgb(${r}, ${g}, ${b})`,
    make_rgba_color: (r, g, b, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`,
    random_color: () => `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    random_light_color: () =>
      '#' +
      (
        '00000' + Math.floor(Math.random() * Math.pow(16, 6)).toString(16)
      ).slice(-6),
    rgb_to_hex: (color) => {
      const [r, g, b] = color.split('(')[1].split(')')[0].split(',').map(Number)
      function componentToHex(c) {
        var hex = c.toString(16)
        return hex.length == 1 ? '0' + hex : hex
      }
      return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
    },
    invert_hex_color: (hex) =>
      '#' +
      (Number(`0x1${hex.split('#')[1]}`) ^ 0xffffff)
        .toString(16)
        .substring(1)
        .toUpperCase(),
  },
  BITWISE: {
    NAME: 'BITWISE',
    make_bit: (dec) => (dec >>> 0).toString(2),
    and: (a, b) => a & b,
    not: (a) => ~a,
    or: (a, b) => a | b,
    xor: (a, b) => a ^ b,
    left_shift: (a, b) => a << b,
    right_shift: (a, b) => a >> b,
    un_right_shift: (a, b) => a >>> b,
  },
  MATH: {
    NAME: 'MATH',
    factorial: (num) => {
      let rval = 1
      for (let i = 2; i <= num; i++) rval = rval * i
      return rval
    },
    permutations: (n, k) => {
      const fact = LIBRARY.MATH.factorial
      const p = fact(n)
      const v = fact(n - k)
      return p / v
    },
    permutations_array: (inputArr) => {
      let result = new Inventory()
      const permute = (arr, m = new Inventory()) => {
        if (arr.length === 0) result.push(m)
        else {
          for (let i = 0; i < arr.length; i++) {
            let curr = arr.slice()
            let next = curr.splice(i, 1)
            permute(curr.slice(), m.concat(next))
          }
        }
      }
      permute(inputArr)
      return result.balance()
    },
    lerp: (start, end, amt) => (1 - amt) * start + amt * end,
    abs: (num) => Math.abs(num),
    mod: (left, right) => ((left % right) + right) % right,
    clamp: (num, min, max) => Math.min(Math.max(num, min), max),
    sqrt: (num) => Math.sqrt(num),
    inc: (a, i = 1) => (a += i),
    add: (a, b) => a + b,
    sub: (a, b) => a - b,
    mult: (a, b) => a * b,
    pow: (a, b) => a ** b,
    pow2: (a) => a ** 2,
    divide: (a, b) => a / b,
    sign: (n) => Math.sign(n),
    trunc: (n) => Math.trunc(n),
    exp: (n) => Math.exp(n),
    floor: (n) => Math.floor(n),
    round: (n) => Math.round(n),
    random: () => Math.random(),
    random_int: (min, max) => Math.floor(Math.random() * (max - min + 1) + min),
    max: (...args) => Math.max(...args),
    min: (...args) => Math.min(...args),
    sin: (n) => Math.sin(n),
    cos: (n) => Math.cos(n),
    tan: (n) => Math.tan(n),
    tanh: (n) => Math.tanh(n),
    atan: (n) => Math.atan(n),
    atanh: (n) => Math.atanh(n),
    atan2: (y, x) => Math.atan2(y, x),
    acos: (n) => {
      n = Math.acos(n)
      return isNaN(n) ? VOID : n
    },
    acosh: (n) => {
      n = Math.acosh(n)
      return isNaN(n) ? VOID : n
    },
    asin: (n) => {
      n = Math.asin(n)
      return isNaN(n) ? VOID : n
    },
    asinh: (n) => Math.asinh(n),
    atanh: (n) => {
      n = Math.atanh(n)
      return isNaN(n) ? VOID : n
    },
    hypot: (x, y) => Math.hypot(x, y),
    fround: (n) => Math.fround(n),
    log10: (x) => Math.log10(x),
    log2: (x) => Math.log2(x),
    log: (x) => Math.log(x),
    sum: (arr) => arr.reduce((acc, item) => (acc += item), 0),
    MININT: Number.MIN_SAFE_INTEGER,
    MAXINT: Number.MAX_SAFE_INTEGER,
    infinity: Number.POSITIVE_INFINITY,
    negative: (n) => -n,
    PI: Math.PI,
    E: Math.E,
    LN10: Math.LN10,
    LOG10E: Math.LOG10E,
    SQRT1_2: Math.SQRT1_2,
    SQRT2: Math.SQRT2,
    parse_int: (number, base) => parseInt(number.toString(), base),
    number: (string) => Number(string),
  },
  STRING: {
    NAME: 'STRING',
    lzutf8_compress: (string) =>
      LZUTF8.compress(string, { outputEncoding: 'StorageBinaryString' }),
    lzutf8_decompress: (source) =>
      LZUTF8.decompress(source.trim(), {
        inputEncoding: 'StorageBinaryString',
        outputEncoding: 'String',
      }),
    to_capital_case: (string) => string[0].toUpperCase() + string.substring(1),
    from_char_code: (code) => String.fromCharCode(code),
    interpolate: (...args) => {
      return args.reduce((acc, item) => {
        return (acc += item.toString())
      }, '')
    },
    includes: (string, target) => string.includes(target),
    string: (thing) => thing.toString(),
    upper_case: (string) => string.toUpperCase(),
    lower_case: (string) => string.toLowerCase(),
    trim: (string) => string.trim(),
    trim_start: (string) => string.trimStart(),
    trim_end: (string) => string.trimEnd(),
    substring: (string, start, end) =>
      string.substring(start, end ?? end.length),
    replace: (string, match, replace) => string.replace(match, replace),
    replace_all: (string, match, replace) => string.replaceAll(match, replace),
    sp: ' ',
  },
  CONVERT: {
    NAME: 'CONVERT',
    array: (thing) => [...thing],
    boolean: (thing) => Boolean(thing),
    string: (thing) => thing.toString(),
    integer: (number) => parseInt(number.toString()),
    float: (number, base = 1) => +Number(number).toFixed(base),
    number: (thing) => Number(thing),
    cast: (value, type) => {
      if (type === '1')
        return typeof value === 'object'
          ? Object.keys(value).length
          : Number(value)
      else if (type === '')
        return typeof value === 'object' ? JSON.stringify(value) : String(value)
      else if (value === null || value === undefined) return VOID
      else if (type === '.:') {
        if (Inventory.isBrrr(value)) return value
        else if (typeof value === 'string') return [...value]
        else if (typeof value === 'number')
          return [...String(value)].map(Number)
        else if (typeof value === 'object') return Object.entries(value)
      } else if (type === '::') {
        if (typeof value === 'string' || Array.isArray(value))
          return { ...value }
        else if (typeof value === 'number') {
          const out = { ...String(value) }
          for (const key in out) {
            out[key] = Number(out[key])
          }
          return out
        } else if (typeof value === 'object') return value
      } else return VOID
    },
  },
  CONSOLE: {
    console_log: (thing) => console.log(thing),
    NAME: 'CONSOLE',
  },
  LOGIC: {
    NAME: 'LOGIC',
    is_string: (string) => +(typeof string === 'string'),
    is_number: (number) => +(typeof number === 'number'),
    is_not_string: (string) => +!(typeof string === 'string'),
    is_not_number: (number) => +!(typeof number === 'number'),
    is_not_array: (array) => +!Inventory.isBrrr(array),
    is_array: (array) => +Inventory.isBrrr(array),
    is_map: (map) => +(map instanceof Map),
    is_not_map: (map) => +!(map instanceof Map),
    is_true: (bol) => +(!!bol === true),
    is_false: (bol) => +(!!bol === false),
    is_equal: (a, b) => +Inventory.of(a).isEqual(Inventory.of(b)),
  },
  LOOP: {
    NAME: 'LOOP',
    for_of: (iterable, callback) => {
      for (const [, value] of iterable) {
        callback(value, iterable)
      }
      return iterable
    },
    iterate: (iterable, callback) => {
      for (const [key, value] of iterable) {
        callback(key, value, iterable)
      }
      return iterable
    },
    generator: (entity = [], index = 0) => {
      return function* () {
        while (true) {
          yield entity[index++]
        }
      }
    },
    counter: (index = 0) => {
      return function* () {
        while (true) {
          yield index++
        }
      }
    },
    next: (entity) => {
      return entity.next().value
    },

    for_of_every: (iterable, callback) => {
      for (const x of iterable) {
        callback(x)
      }
      return iterable
    },
    routine: (entity, times, callback) => {
      let out = VOID
      for (let i = 0; i < times; ++i) out = callback(entity, i)
      return out
    },
    loop: (start, end, callback) => {
      for (let i = start; i < end; ++i) callback(i)
    },
    while_true: (condition, callback) => {
      let out = VOID
      while (condition()) out = callback()
      return out
    },
    repeat: (times, callback) => {
      let out = VOID
      for (let i = 0; i < times; ++i) out = callback(i)
      return out
    },
    tail_call_optimised_recursion:
      (func) =>
      (...args) => {
        let result = func(...args)
        while (typeof result === 'function') result = result()
        return result
      },
  },
  ARRAY: {
    NAME: 'ARRAY',
    from: (arr) => Inventory.from(arr),
    split_new_line: (str) => Inventory.from(str.split('\n')),
    split_spaces: (str) => Inventory.from(str.split(' ')),
    split: (str, separator) => Inventory.from(str.split(separator)),
    join: (entity, separator) => entity.join(separator),
    shuffle: (array) => {
      array = array.toArray()
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
      }
      return Inventory.from(array)
    },
    zeroes: (size) => Inventory.zeroes(size),
    ones: (size) => Inventory.ones(size),
    range: (start, end, step = 1) => {
      const arr = new Inventory()
      if (start > end)
        for (let i = start; i >= end; i -= 1) arr.append(i * step)
      else for (let i = start; i <= end; i += 1) arr.append(i * step)
      return arr.balance()
    },
  },
  TIME: {
    NAME: 'TIME',
    set_timeout: (callback, time) => setTimeout(callback, time),
    set_interval: (callback, time = 1000) => setInterval(callback, time),
    set_animation: (callback) => requestAnimationFrame(callback),
  },
  EVENT: {
    NAME: 'EVENT',
    on_input_change: (element, callback) => {
      element.addEventListener('change', (e) => callback(e.target.value))
      return element
    },
    on_mouse_click: (element, callback) => {
      element.addEventListener('click', (e) => callback(e.target))
      return element
    },
    on_mouse_over: (element, callback) => {
      element.addEventListener('mouseover', (e) => callback(e.target))
      return element
    },
    on_key_down: (element, callback) => {
      element.addEventListener('keydown', (e) => callback(e.key))
      return element
    },
    on_key_up: (element, callback) => {
      element.addEventListener('keyup', (e) => callback(e.key))
      return element
    },
    game_controller: (element, keyMap) => {
      element.addEventListener('keydown', (e) => {
        e.preventDefault()
        const key = keyMap.get(e.key.toLowerCase())
        key && key()
      })
      return element
    },
  },
  SKETCH: {
    NAME: 'SKETCH',
    // UTILS: {
    //   NAME: 'UTILS',
    //   make_frame: (linewidth = 1, color = '#6b84b0') => {
    //     const two = LIBRARY.SKETCH.engine;
    //     const rect = two.makeRectangle(
    //       two.width / 2,
    //       two.height / 2,
    //       two.width,
    //       two.height
    //     );
    //     rect.stroke = color;
    //     rect.linewidth = linewidth;
    //     rect.noFill();
    //   },
    //   make_grid: (size = 30, linewidth = 1, color = '#6b84b0') => {
    //     const two = new Two({
    //       type: Two.Types.canvas,
    //       width: LIBRARY.SKETCH.engine.width,
    //       height: LIBRARY.SKETCH.engine.height
    //     });
    //     const a = two.makeLine(two.width / 2, 0, two.width / 2, two.height);
    //     const b = two.makeLine(0, two.height / 2, two.width, two.height / 2);
    //     a.stroke = b.stroke = color;
    //     a.linewidth = b.linewidth = linewidth;
    //     two.update();

    //     const imageData = two.renderer.domElement.toDataURL('image/png');
    //     LIBRARY.SKETCH.CANVAS_CONTAINER.firstChild.style.backgroundImage = `url(${imageData})`;
    //     LIBRARY.SKETCH.CANVAS_CONTAINER.firstChild.style.backgroundSize = `${size}px`;
    //   }
    // },
    background: (color = 'var(--background-primary)') =>
      (LIBRARY.SKETCH.CANVAS_CONTAINER.firstChild.style.background = color),
    sketch: (width = 100, height = 100) => {
      const placeholder = document.getElementById('placeholder')
      if (placeholder) {
        placeholder.style.display = 'none'
      }
      let container = document.getElementById('canvas-container')
      if (!container) {
        container = document.createElement('div')
        container.setAttribute('id', 'canvas-container')
        document.body.appendChild(container)
      } else {
        container.innerHTML = ''
      }
      LIBRARY.SKETCH.CANVAS_CONTAINER = container
      LIBRARY.SKETCH.svg_canvas = SVG().size(width, height)
      LIBRARY.SKETCH.svg_canvas.addTo(container)
      LIBRARY.SKETCH.rough_engine = rough.svg(LIBRARY.SKETCH.svg_canvas)
      return SVG(
        LIBRARY.SKETCH.rough_engine.rectangle(0, 0, width, height)
      ).addTo(LIBRARY.SKETCH.svg_canvas)
    },
    line: (x1, y1, x2, y2) => ({ coords: [x1, y1, x2, y2], type: 'line' }),
    rectangle: (x, y, w, h) => ({ coords: [x, y, w, h], type: 'rectangle' }),
    circle: (x, y, r) => ({ coords: [x, y, r], type: 'circle' }),
    ellipse: (x, y, w, h) => ({ coords: [x, y, w, h], type: 'ellipse' }),
    polygon: (vertecies) => ({ coords: [vertecies.items], type: 'polygon' }),
    text: (text = 'text') => ({ content: text }),
    fill: (shape, color) => {
      shape.fill = color
      return shape
    },
    stroke: (shape, color) => {
      shape.stroke = color
      return shape
    },
    fill_weight: (shape, weight) => {
      shape.fillWeight = weight
      return shape
    },
    hachure_angle: (shape, angle) => {
      shape.hachureAngle = angle
      return shape
    },
    hachure_gap: (shape, gap) => {
      shape.hachureGap = gap
      return shape
    },
    curve_step_count: (shape, count) => {
      shape.curveStepCount = count
      return shape
    },
    curve_fitting: (shape, amount) => {
      shape.curveFitting = amount
      return shape
    },
    stroke_line_dash: (shape, amount) => {
      shape.strokeLineDash = amount
      return shape
    },
    stroke_line_dash_offset: (shape, offset) => {
      shape.strokeLineDashOffset = offset
      return shape
    },
    fill_line_dash: (shape, amount) => {
      shape.fillLineDash = amount
      return shape
    },
    fill_line_dash_offset: (shape, amount) => {
      shape.fillLineDashOffset = amount
      return shape
    },
    disable_multi_stroke: (shape, bol) => {
      shape.disableMultiStroke = bol
      return shape
    },
    disable_multi_stroke_fill: (shape, bol) => {
      shape.disableMultiStrokeFill = bol
      return shape
    },
    simplification: (shape, amount) => {
      shape.simplification = amount
      return shape
    },
    dash_offset: (shape, amount) => {
      shape.dashOffset = amount
      return shape
    },
    dash_gap: (shape, amount) => {
      shape.dashGap = amount
      return shape
    },
    zigzag_offset: (shape, amount) => {
      shape.zigzagOffset = amount
      return shape
    },
    preserve_vertices: (shape, bol) => {
      shape.preserveVertices = bol
      return shape
    },
    seed: (shape, amount) => {
      shape.seed = amount
      return shape
    },
    fill_style: (shape, style) => {
      shape.fillStyle = style
      return shape
    },
    roughness: (shape, amount) => {
      shape.roughness = amount
      return shape
    },
    bowing: (shape, amount) => {
      shape.bowing = amount
      return shape
    },
    stroke_width: (shape, width) => {
      shape.strokeWidth = width
      return shape
    },
    move: (shape, x, y) => {
      shape.move(x, y)
      return shape
    },
    x: (shape) => {
      return shape.x()
    },
    y: (shape) => {
      return shape.y()
    },
    size: (shape, w, h) => {
      shape.size(w, h)
      return shape
    },
    scale: (shape, s) => {
      shape.scale(s)
      return shape
    },
    rotate: (shape, a) => {
      shape.rotate(a)
      return shape
    },
    opacity: (shape, o) => {
      shape.opacity(o)
      return shape
    },
    center: (shape, x, y) => {
      shape.center(x, y)
      return shape
    },
    group: () => {
      return LIBRARY.SKETCH.svg_canvas.group()
    },
    insert: (group, shapes) => {
      shapes.forEach((s) => group.add(s))
      return group
    },
    add: (group, shape) => {
      group.add(shape)
      return group
    },
    add_to: (shape, group) => {
      shape.addTo(group)
      return shape
    },
    write: ({ content, fill }) => {
      const text = LIBRARY.SKETCH.svg_canvas.plain(content)
      text.fill(fill)
      text.addTo(LIBRARY.SKETCH.svg_canvas)
      return text
    },
    draw: ({ type, coords, ...options }) => {
      const shape = SVG(LIBRARY.SKETCH.rough_engine[type](...coords, options))
      shape.addTo(LIBRARY.SKETCH.svg_canvas)
      return shape
    },
  },
}

export const STD = {
  void: VOID,
  LIBRARY,
}
