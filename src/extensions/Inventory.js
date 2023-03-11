/*
  O (1) insertions at start
  O (1) insertions at end
  O (1) deletionss at start
  O (1) deletionss at end
  O (1) random access
*/
export default class Inventory {
  #left = [Inventory.#negativeZeroSymbol]
  #right = []

  get offsetLeft() {
    return (this.#left.length - 1) * -1
  }

  get offsetRight() {
    return this.#right.length
  }

  get length() {
    return this.#left.length + this.#right.length - 1
  }

  set length(n) {
    const len = this.length
    if (n === len) return len
    len > n ? this.removeFrom(n, len - n - 1) : this.addTo(n - 1, undefined)
    return this.length
  }

  get first() {
    return this.get(0)
  }

  get last() {
    return this.get(this.length - 1)
  }

  get items() {
    return Inventory._toArrayDeep(this)
  }

  get reflection() {
    return { left: this.#left, right: this.#right }
  }
  /**
   * Returns the number of dimensions
   * and their length
   * @example [[[2], [[3], [2], [1]], [6]], [3]]
   */
  get shape() {
    return Inventory._toShapeDeep(this)
  }

  with(...initial) {
    if (this.length) this.clear()
    const half = (initial.length / 2) | 0.5
    for (let i = half - 1; i >= 0; --i) this.#addToLeft(initial[i])
    for (let i = half; i < initial.length; ++i) this.#addToRight(initial[i])
    return this
  }
  /**
   *  index = |offset + offset left|
   *  if (offset + offset left >= 0) -> right [index]
   *  else ->  left [index]
   */
  get(offset) {
    const offsetIndex = offset + this.offsetLeft
    const index = offsetIndex < 0 ? offsetIndex * -1 : offsetIndex
    return offsetIndex >= 0 ? this.#right[index] : this.#left[index]
  }

  set(index, value) {
    const offset = index + this.offsetLeft
    if (offset >= 0) this.#right[offset] = value
    else this.#left[offset * -1] = value
    return this
  }

  clear() {
    this.#left.length = 1
    this.#right.length = 0
    return this
  }

  #addToLeft(item) {
    this.#left.push(item)
  }

  #addToRight(item) {
    this.#right.push(item)
  }

  #removeFromLeft() {
    const len = this.length
    if (len) {
      if (len === 1) this.clear()
      else if (this.#left.length > 0) this.#left.pop()
    }
  }

  #removeFromRight() {
    const len = this.length
    if (len) {
      if (len === 1) this.clear()
      else if (this.#right.length > 0) this.#right.pop()
    }
  }

  [Symbol.iterator] = function* () {
    for (let i = 0, len = this.length; i < len; ++i) yield this.get(i)
  }

  isBalanced() {
    return this.offsetRight + this.offsetLeft === 0
  }

  isCompact() {
    return this.every((x) => x != undefined)
  }

  isSparce() {
    return this.some((x) => x == undefined)
  }

  isEqual(other) {
    return Inventory._isEqual(this, other)
  }

  balance() {
    if (this.isBalanced()) return this
    const initial = [...this]
    this.clear()
    const half = (initial.length / 2) | 0.5
    for (let i = half - 1; i >= 0; --i) this.#addToLeft(initial[i])
    for (let i = half; i < initial.length; ++i) this.#addToRight(initial[i])
    return this
  }

  imbalance(dir = 1) {
    const copy = this.copy()
    this.clear()
    if (dir === 1)
      for (let i = 0, len = copy.length; i < len; ++i)
        this.#addToRight(copy.chop())
    else
      for (let i = 0, len = copy.length; i < len; ++i)
        this.#addToLeft(copy.cut())
    return this
  }

  /**
   * negativeZeroSymbol is the first left index
   * It is never used.
   * It stays there as an offset
   * Indexing is calculated (offset + offset left)
   * where positive results are indexing the right branch
   * and negative are indexing the left branch
   * index 2 is the third item of branch right
   * index -2 is the third item of branch left
   * When zero index is calculated to be 0 then
   * the item is the first element of the right branch
   * The left branch will have an unreachable value
   * @example
   * // Regular Array View
   * [1, 2, 3, 4, 5, 6]
   * // The above as Brrry Array
   * [-0, 3, 2, 1] // left
   *   0  1  2  3  // indexes
   * [ 4, 5. 6, 7] // right
   */
  static #negativeZeroSymbol = Symbol('-0')

  static of(...items) {
    return Inventory.from(items)
  }

  static isBrrr(entity) {
    return entity instanceof Inventory
  }

  static from(iterable) {
    if (!Inventory._isIterable(iterable))
      throw new Error('TypeError: From input is not iterable')
    const out = new Inventory()
    const half = (iterable.length / 2) | 0.5
    for (let i = half - 1; i >= 0; --i) out.#addToLeft(iterable[i])
    for (let i = half; i < iterable.length; ++i) out.#addToRight(iterable[i])
    return out
  }

  static matrix(...dimensions) {
    return Inventory._toMatrix(...dimensions)
  }

  static zeroes(size) {
    return Inventory.from(new Array(size).fill(0))
  }

  static ones(size) {
    return Inventory.from(new Array(size).fill(1))
  }

  at(index) {
    if (index < 0) return this.get(this.length + index)
    else return this.get(index)
  }

  push(...items) {
    for (let i = 0; i < items.length; ++i) this.#addToRight(items[i])
    return this.length
  }

  unshift(...items) {
    for (let i = items.length - 1; i >= 0; --i) this.#addToLeft(items[i])
    return this.length
  }

  pop() {
    if (this.offsetRight === 0) this.balance()
    const last = this.last
    this.#removeFromRight()
    return last
  }

  shift() {
    if (this.offsetLeft === 0) this.balance()
    const first = this.first
    this.#removeFromLeft()
    return first
  }
  /**
   * Returns a copy of a section of an array. For both start and end,
   * a negative index can be used to indicate an offset from the end of the array. For example,
   * -2 refers to the second to last element of the array.
   * @param start
   * The beginning index of the specified portion of the array.
   * If start is undefined, then the slice begins at index 0.
   * @param end
   * The end index of the specified portion of the array.
   * This is exclusive of the element at the index 'end'.
   * If end is undefined, then the slice extends to the end of the array.
   */
  slice(start = 0, end = this.length) {
    const length = this.length
    start = start < 0 ? Math.max(length + start, 0) : Math.min(start, length)
    end = end < 0 ? Math.max(length + end, 0) : Math.min(end, length)

    const slice = new Inventory()
    const sliceLen = Math.max(end - start, 0)
    const half = (sliceLen / 2) | 0.5
    for (let i = half - 1; i >= 0; --i) slice.#addToLeft(this.get(start + i))
    for (let i = half; i < sliceLen; ++i) slice.#addToRight(this.get(start + i))
    return slice
  }
  /**
   * Removes elements from an array and,
   * if necessary, inserts new elements in their place,
   * returning the deleted elements.
   * @param start — The zero-based location in the array from which to start removing elements.
   * @param deleteCount — The number of elements to remove.
   * @returns — An array containing the elements that were deleted.
   */
  splice(dir, deleteCount, ...items) {
    const start = Math.abs(dir)
    deleteCount = deleteCount ?? this.length - start
    deleteCount = Math.min(deleteCount, this.length - start)
    const deleted = new Inventory()
    if (this.offsetLeft + start > 0) {
      const len = this.length - start - deleteCount
      this.rotateRight(len)
      if (deleteCount > 0)
        for (let i = 0; i < deleteCount; ++i) deleted.push(this.cut())
      dir < 0 ? this.unshift(...items) : this.push(...items)
      for (let i = 0; i < len; ++i) this.append(this.chop())
    } else {
      this.rotateLeft(start)
      if (deleteCount > 0)
        for (let i = 0; i < deleteCount; ++i) deleted.push(this.chop())
      dir < 0 ? this.push(...items) : this.unshift(...items)
      for (let i = 0; i < start; ++i) this.prepend(this.cut())
    }
    return deleted
  }
  /**
   * Returns the index of the first occurrence of a value in an array,
   * or -1 if it is not present.
   * @param searchElement — The value to locate in the array.
   * @param fromIndex — The array index at which to begin the search.
   * If fromIndex is omitted, the search starts at index 0.
   */
  indexOf(item) {
    for (let i = 0, len = this.length; i < len; ++i)
      if (this.get(i) === item) return i
    return -1
  }
  /**
   * Returns the index of the last occurrence of a specified value in an array,
   * or -1 if it is not present.
   * @param searchElement — The value to locate in the array.
   * @param fromIndex — The array index at which to begin searching backward.
   * If fromIndex is omitted, the search starts at the last index in the array.
   */
  lastIndexOf(item) {
    for (let i = this.length - 1; i >= 0; --i)
      if (this.get(i) === item) return i
  }

  includes(val, fromIndex = 0) {
    for (let i = fromIndex, len = this.length; i < len; ++i)
      if (Inventory._sameValueZero(this.get(i), val)) return true
    return false
  }
  /**
   * Returns the value of the first element in the array where predicate is true, and undefined otherwise.
   * @param predicate
   * find calls predicate once for each element of the array, in ascending order, until it finds one where predicate returns true. If such an element is found, find immediately returns that element value. Otherwise, find returns undefined.
   */
  find(callback = Inventory._Identity, startIndex = 0) {
    for (let i = startIndex, len = this.length; i < len; ++i) {
      if (i >= this.length) return
      const current = this.get(i)
      if (callback(current, i, this)) return current
    }
  }

  findLast(callback = Inventory._Identity, startIndex = 0) {
    for (let i = this.length - 1 - startIndex; i >= 0; --i) {
      if (i >= this.length) return
      const current = this.get(i)
      if (callback(current, i, this)) return current
    }
  }
  /**
   * Determines whether the specified callback function returns true for any element of an array.
   * @param predicate
   * A function that accepts up to three arguments.
   * The some method calls the predicate function for each element in the array
   * until the predicate returns a value which is coercible to the Boolean value true,
   * or until the end of the array.
   */
  some(callback = Inventory._Identity) {
    for (let i = 0, len = this.length; i < len; ++i)
      if (callback(this.get(i), i, this)) return true
    return false
  }
  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param predicate
   * A function that accepts up to three arguments. The every method calls the predicate function for each element in the array until the predicate returns a value which is coercible to the Boolean value false, or until the end of the array.
   */
  every(callback = Inventory._Identity) {
    for (let i = 0, len = this.length; i < len; ++i)
      if (i >= this.length || !callback(this.get(i), i, this)) return false
    return true
  }

  findIndex(callback = Inventory._Identity, startIndex = 0) {
    for (let i = startIndex, len = this.length; i < len; ++i) {
      const current = this.get(i)
      if (callback(current, i, this)) return i
    }
    return -1
  }

  findLastIndex(callback = Inventory._Identity, startIndex = 0) {
    for (let i = this.length - 1 - startIndex; i >= 0; --i) {
      const current = this.get(i)
      if (callback(current, i, this)) return i
    }
    return -1
  }
  /**
   * Calls a defined callback function on each element of an array,
   * and returns an array that contains the results.
   * @param callbackfn — A function that accepts up to three arguments.
   * The map method calls the callbackfn function one time for each element in the array.
   */
  map(callback) {
    const result = new Inventory()
    const half = (this.length / 2) | 0.5
    for (let i = half - 1; i >= 0; --i)
      result.#addToLeft(callback(this.get(i), i, this))
    for (let i = half, len = this.length; i < len; ++i)
      result.#addToRight(callback(this.get(i), i, this))
    return result
  }
  mapRight(callback) {
    const result = new Inventory()
    const half = (this.length / 2) | 0.5
    for (let i = half - 1; i >= 0; --i)
      result.#addToRight(callback(this.get(i), i, this))
    for (let i = half, len = this.length; i < len; ++i)
      result.#addToLeft(callback(this.get(i), i, this))
    return result
  }
  mapMut(callback) {
    for (let i = 0, len = this.length; i < len; ++i)
      this.set(i, callback(this.get(i), i, this))
    return this
  }
  mapMutRight(callback) {
    for (let i = this.length; i >= 0; --i)
      this.set(i, callback(this.get(i), i, this))
    return this
  }
  forEach(callback) {
    for (let i = 0, len = this.length; i < len; ++i)
      callback(this.get(i), i, this)
  }
  /**
   * Calls the specified callback function for all the elements in an array.
   * The return value of the callback function is the accumulated result,
   * and is provided as an argument in the next call to the callback function.
   * @param callbackfn — A function that accepts up to four arguments.
   * The reduce method calls the callbackfn function one time for each element in the array.
   * @param initialValue — If initialValue is specified,
   * it is used as the initial value to start the accumulation.
   * The first call to the callbackfn function provides this value as an argument
   * instead of an array value.
   */
  reduce(callback, initial = this.get(0)) {
    for (let i = 0, len = this.length; i < len; ++i)
      initial = callback(initial, this.get(i), i, this)
    return initial
  }

  reduceRight(callback, initial = this.at(-1)) {
    for (let i = this.length - 1; i >= 0; --i)
      initial = callback(initial, this.get(i), i, this)
    return initial
  }
  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param predicate — A function that accepts up to three arguments.
   * The filter method calls the predicate function one time for each element in the array.
   */
  filter(callback = Inventory._Identity) {
    const out = []
    for (let i = 0, len = this.length; i < len; ++i) {
      const current = this.get(i)
      const predicat = callback(current, i, this)
      if (predicat) out.push(current)
    }
    return Inventory.from(out)
  }

  reject(callback = Inventory._Identity) {
    const out = []
    for (let i = 0, len = this.length; i < len; ++i) {
      const current = this.get(i)
      const predicat = !callback(current, i, this)
      if (predicat) out.push(current)
    }
    return Inventory.from(out)
  }
  /**
   * Reverses the elements in an array in place.
   * This method mutates the array and returns a reference to the same array.
   */
  reverse() {
    const left = this.#left
    const right = this.#right
    right.unshift(left.shift())
    this.#left = right
    this.#right = left
    return this
  }

  /**
   * The group method executes the callback function once for each index of the Brrry Array,
   * returning a string (or value that can be coerced to a string) indicating the group of the element.
   * A new property and Brrry Array is created in the result object for each unique group name
   * that is returned by the callback.
   * Each element is added to the Brrry Array in the property that corresponds to its group.
   * @param callback - (item, index, arr )
   * @returns Object
   * @example
   * Inventory.with(1,2,3,4).group((item) => (item % 2 == 0 ? "even" : "odd")
   * // retunrs (this is array view)
   * {"odd":[1,3],"even":[2,4]}
   */
  group(callback = Inventory._Identity) {
    const out = this.reduce((acc, item, index, arr) => {
      const key = callback(item, index, arr)
      if (acc.has(key)) acc.get(key).append(item)
      else acc.set(key, new Inventory(key).with(item))
      return acc
    }, new Map())
    out.forEach((item) => item.balance())
    return out
  }

  /**
   * perform merge sort - requires extra memory
   * @param callback - the condition of sorting
   * defaults to ascending
   * @example
   * (a, b) => (a < b ? -1 : 1)
   * */
  mergeSort(callback = (a, b) => (a < b ? -1 : 1)) {
    return Inventory._mergeSort(this, callback)
  }
  /**
   * perform quick sort - requires extra memory
   * @param order - the order of sorting
   * defaults to ascending
   * @example
   * arr.quickSort(1)
   * arr.quickSort(-1)
   * */
  quickSort(order) {
    return order === -1
      ? Inventory._quickSortDesc(this, 0, this.length - 1)
      : Inventory._quickSortAsc(this, 0, this.length - 1)
  }

  join(separator = ',') {
    let output = ''
    for (let i = 0, len = this.length; i < len - 1; ++i)
      output += this.get(i) + separator
    output += this.get(this.length - 1)
    return output
  }

  merge(...arrays) {
    arrays.forEach((array) => {
      array.forEach((item) => this.append(item))
    })
    return this
  }

  concat(second) {
    return Inventory.from([...this, ...second])
  }
  /**
   * Returns a new array with all sub-array elements concatenated
   * into it recursively up to the specified depth.
   * @param depth — The maximum recursion depth
   */
  flat(levels = 1) {
    const flat =
      levels === Infinity
        ? (collection) => Inventory._flatten(collection, levels, flat)
        : (collection, levels) => {
            levels--
            return levels === -1
              ? collection
              : Inventory._flatten(collection, levels, flat)
          }
    return Inventory.from(flat(this, levels))
  }

  flatten(callback) {
    return Inventory.from(
      this.reduce((acc, current, index, self) => {
        if (Inventory.isBrrr(current))
          current.forEach((item, i, a) => acc.push(callback(item, i, a)))
        else acc.push(callback(current, index, self))
        return acc
      }, [])
    )
  }

  addTo(index, value) {
    if (index >= this.length)
      for (let i = this.length; i <= index; ++i) this.#addToRight(undefined)
    const offset = index + this.offsetLeft
    if (offset >= 0) this.#right[offset] = value
    else this.#left[offset * -1] = value
    return this
  }

  addAt(index, ...value) {
    if (this.offsetLeft + index > 0) {
      const len = this.length - index
      this.rotateRight(len)
      this.push(...value)
      for (let i = 0; i < len; ++i) this.append(this.shift())
    } else {
      this.rotateLeft(index)
      this.unshift(...value)
      for (let i = 0; i < index; ++i) this.prepend(this.pop())
    }
    return this
  }

  removeFrom(index, amount) {
    const length = this.length
    if (length - 1 <= index) return this.head()
    const len = length - index
    amount = Math.min(len, amount)
    const isCloserToTheRight = this.offsetLeft + index > 0
    if (isCloserToTheRight) {
      this.rotateRight(len)
      for (let i = 0; i < amount; ++i) this.cut()
      for (let i = 0; i < len; ++i) this.append(this.chop())
    } else {
      this.rotateLeft(index)
      for (let i = 0; i < amount; ++i) this.chop()
      for (let i = 0; i < index; ++i) this.prepend(this.cut())
    }
    return this
  }
  /**
   * Convert to JavaScript Array
   * by default only converts on the first level
   * @param deep — convert nested structures to JavaScript Array
   */
  toArray(deep = false) {
    return deep ? Inventory._toArrayDeep(this) : [...this]
  }

  async toPromise() {
    return Inventory.from(await Promise.all(this.items))
  }

  append(item) {
    this.#addToRight(item)
    return this
  }

  prepend(item) {
    this.#addToLeft(item)
    return this
  }
  /**
   * Remove the last element
   * @returns the removed element
   */
  cut() {
    if (this.offsetRight === 0) this.balance()
    const last = this.last
    this.#removeFromRight()
    return last
  }
  /**
   * Remove the first element
   * @returns the removed element
   */
  chop() {
    if (this.offsetLeft === 0) this.balance()
    const first = this.first
    this.#removeFromLeft()
    return first
  }

  head() {
    if (this.offsetRight === 0) this.balance()
    this.#removeFromRight()
    return this
  }

  tail() {
    if (this.offsetLeft === 0) this.balance()
    this.#removeFromLeft()
    return this
  }

  insertRight(...items) {
    for (let i = 0; i < items.length; ++i) this.#addToRight(items[i])
    return this
  }

  insertLeft(...items) {
    for (let i = items.length - 1; i >= 0; --i) this.#addToLeft(items[i])
    return this
  }

  /**
   * Creates a slice of array with n elements taken from the beginning.
   * @params
    array (Array): The array to query.
    [n=1] (number): The number of elements to take.
    @returns
    (Array): Returns the slice of array.
    @example 
    [1, 2, 3].take() // => [1]
    [1, 2, 3].take(2) // => [1, 2]
    [1, 2, 3].take(5) // => [1, 2, 3]
    [1, 2, 3].take(0); // => []
   */
  take(n = 1) {
    const slice = new Inventory()
    const sliceLen = Math.min(n, this.length)
    const half = (sliceLen / 2) | 0.5
    for (let i = half - 1; i >= 0; --i) slice.#addToLeft(this.get(i))
    for (let i = half; i < sliceLen; ++i) slice.#addToRight(this.get(i))
    return slice
  }
  /**
   * Creates a slice of array with n elements taken from the end.
   */
  takeRight(n = 1) {
    const length = this.length
    const slice = new Inventory()
    const sliceLen = Math.min(n, length)
    const half = (sliceLen / 2) | 0.5
    for (let i = half - 1; i >= 0; --i)
      slice.#addToLeft(this.get(length - (sliceLen - i)))
    for (let i = half; i < sliceLen; ++i)
      slice.#addToRight(this.get(length - (sliceLen - i)))
    return slice
  }

  to(callback, initial = new Inventory()) {
    for (let i = 0, len = this.length; i < len; ++i)
      initial = callback(initial, this.get(i), i, this)
    return initial
  }

  rotateLeft(n = 1) {
    n = n % this.length
    for (let i = 0; i < n; ++i) {
      if (this.offsetLeft === 0) this.balance()
      this.#addToRight(this.first)
      this.#removeFromLeft()
    }
    return this
  }

  rotateRight(n = 1) {
    n = n % this.length
    for (let i = 0; i < n; ++i) {
      if (this.offsetRight === 0) this.balance()
      this.#addToLeft(this.last)
      this.#removeFromRight()
    }
    return this
  }

  rotate(n = 1, direction = 1) {
    return direction === 1 ? this.rotateRight(n) : this.rotateLeft(n)
  }

  // Creates an array excluding all given values using SameValueZero for equality comparisons.
  without(...excludes) {
    return this.filter(
      (item) =>
        !excludes.some((exclude) => Inventory._sameValueZero(item, exclude))
    )
  }

  compact() {
    return this.filter(Boolean)
  }

  union(b) {
    const a = this
    const out = new Inventory()
    const A = new Set(a.toArray())
    const B = new Set(b.toArray())
    A.forEach((item) => out.#addToRight(item))
    B.forEach((item) => out.#addToRight(item))
    out.balance()
    return out
  }

  xor(b) {
    const a = this
    const out = new Inventory()
    const A = new Set(a.toArray())
    const B = new Set(b.toArray())
    B.forEach((item) => !A.has(item) && out.#addToRight(item))
    A.forEach((item) => !B.has(item) && out.#addToRight(item))
    out.balance()
    return out
  }

  intersection(b) {
    const a = this
    const out = new Inventory()
    const A = new Set(a.toArray())
    const B = new Set(b.toArray())
    B.forEach((item) => A.has(item) && out.#addToRight(item))
    out.balance()
    return out
  }

  difference(b) {
    const a = this
    const out = new Inventory()
    const A = new Set(a.toArray())
    const B = new Set(b.toArray())
    A.forEach((item) => !B.has(item) && out.#addToRight(item))
    out.balance()
    return out
  }

  partition(groups = 1) {
    const res = this.reduce((acc, _, index, arr) => {
      if (index % groups === 0) {
        const part = new Inventory()
        const half = (groups / 2) | 0.5
        for (let i = half - 1; i >= 0; --i) {
          const current = arr.get(index + i)
          if (current !== undefined) part.#addToLeft(current)
        }
        for (let i = half; i < groups; ++i) {
          const current = arr.get(index + i)
          if (current !== undefined) part.#addToRight(current)
        }
        acc.#addToRight(part)
      }
      return acc
    }, new Inventory())
    res.balance()
    return res
  }

  unique() {
    const set = new Set()
    return Inventory.from(
      this.reduce((acc, item) => {
        if (!set.has(item)) {
          set.add(item)
          acc.push(item)
        }
        return acc
      }, [])
    )
  }

  duplicates() {
    const set = new Set()
    const extra = []
    const out = this.reduce((acc, item) => {
      set.has(item) ? acc.push(item) : set.add(item)
      return acc
    }, [])

    out.forEach((item) => {
      if (set.has(item)) {
        set.delete(item)
        extra.push(item)
      }
    })
    return Inventory.from(out.concat(extra))
  }

  swap(i1, i2) {
    const temp = this.get(i1)
    this.set(i1, this.get(i2))
    this.set(i2, temp)
    return this
  }

  swapRemoveRight(index) {
    this.set(index, this.cut())
    return this
  }

  swapRemoveLeft(index) {
    this.set(index, this.chop())
    return this
  }

  copy() {
    return Inventory.from([...this])
  }

  scan(callback, dir = 1) {
    if (dir === -1)
      for (let i = this.length - 1; i >= 0; --i) callback(this.get(i), i, this)
    else
      for (let i = 0, len = this.length; i < len; ++i)
        callback(this.get(i), i, this)
    return this
  }

  isEmpty() {
    return this.#left.length + this.#right.length === 1
  }

  isInBounds(index) {
    return index >= 0 && index < this.length
  }

  getInBounds(index) {
    return this.get(Inventory._clamp(index, 0, this.length - 1))
  }

  setInBounds(index, value) {
    return this.set(Inventory._clamp(index, 0, this.length - 1), value)
  }

  getInWrap(index) {
    return this.get(index % this.length)
  }

  setInWrap(index, value) {
    return this.set(index % this.length, value)
  }

  /**
   * @param order
   * check if the array is sorted
   * defaults to scending
   * if a function is provided it will use it instead
   * the default signature is
   * @example
   * (current, index, arr) => !index || arr.at(index - 1) <= current
   * @returns boolean
   */
  isSorted(order = 1) {
    return this.every(
      typeof order === 'function'
        ? order
        : order === 1
        ? (current, index, arr) => !index || arr.at(index - 1) <= current
        : (current, index, arr) => !index || arr.at(index - 1) >= current
    )
  }
  /**
   * perform brrry search queries in the array
   * requires the array to be sorted first!
   * @param target
   * @param identity
   * @param greather
   * @example
   * current => current.key // identity
   * current => identity(current) > target // greather
   * */
  search(target, identity = Inventory._Identity, greather) {
    return Inventory._binarySearch(
      this,
      target,
      identity,
      greather ?? ((current) => identity(current) > target),
      0,
      this.length
    )
  }

  /**  Helper functions */
  /** 
  If Type(x) is different from Type(y), return false.
  If Type(x) is Number, then
  If x is NaN and y is NaN, return true.
  If x is +0 and y is -0, return true.
  If x is -0 and y is +0, return true.
  If x is the same Number value as y, return true.
  Return false.
  Return SameValueNonNumber(x, y).
*/
  static _sameValueZero(x, y) {
    return x === y || (Number.isNaN(x) && Number.isNaN(y))
  }
  static _clamp(num, min, max) {
    return Math.min(Math.max(num, min), max)
  }
  static _isIterable(iter) {
    return iter === null || iter === undefined
      ? false
      : typeof iter[Symbol.iterator] === 'function'
  }
  static _tailCallOptimisedRecursion(func) {
    return (...args) => {
      let result = func(...args)
      while (typeof result === 'function') result = result()
      return result
    }
  }

  static _flatten(collection, levels, flat) {
    return collection.reduce((acc, current) => {
      if (Inventory.isBrrr(current)) acc.push(...flat(current, levels))
      else acc.push(current)
      return acc
    }, [])
  }
  _toMatrix(...args) {
    if (args.length === 0) return
    const dimensions = new Inventory().with(...args)
    const dim = dimensions.chop()
    const arr = new Inventory()
    for (let i = 0; i < dim; ++i) arr.set(i, Inventory._toMatrix(...dimensions))
    return arr
  }
  static _toArrayDeep(entity) {
    return Inventory.isBrrr(entity)
      ? entity
          .map((item) =>
            Inventory.isBrrr(item)
              ? item.some(Inventory.isBrrr)
                ? Inventory._toArrayDeep(item)
                : item.toArray()
              : item
          )
          .toArray()
      : entity
  }
  static _toShapeDeep(entity, out = []) {
    if (Inventory.isBrrr(entity.get(0))) {
      entity.forEach((item) => {
        out.push(Inventory._toShapeDeep(item))
      })
    } else {
      out = [entity.length]
    }
    return out
  }
  static _quickSortAsc(items, left, right) {
    if (items.length > 1) {
      let pivot = items.get(((right + left) / 2) | 0.5),
        i = left,
        j = right
      while (i <= j) {
        while (items.get(i) < pivot) ++i
        while (items.get(j) > pivot) j--
        if (i <= j) {
          items.swap(i, j)
          ++i
          j--
        }
      }
      if (left < i - 1) Inventory._quickSortAsc(items, left, i - 1)
      if (i < right) Inventory._quickSortAsc(items, i, right)
    }
    return items
  }

  static _quickSortDesc(items, left, right) {
    if (items.length > 1) {
      let pivot = items.get(((right + left) / 2) | 0.5),
        i = left,
        j = right
      while (i <= j) {
        while (items.get(i) > pivot) ++i
        while (items.get(j) < pivot) j--
        if (i <= j) {
          items.swap(i, j)
          ++i
          j--
        }
      }
      if (left < i - 1) Inventory._quickSortDesc(items, left, i - 1)
      if (i < right) Inventory._quickSortDesc(items, i, right)
    }
    return items
  }
  static _merge(left, right, callback) {
    const arr = []
    while (left.length && right.length) {
      callback(right.at(0), left.at(0)) > 0
        ? arr.push(left.chop())
        : arr.push(right.chop())
    }

    for (let i = 0; i < left.length; ++i) {
      arr.push(left.get(i))
    }
    for (let i = 0; i < right.length; ++i) {
      arr.push(right.get(i))
    }
    const out = new Inventory()
    const half = (arr.length / 2) | 0.5
    for (let i = half - 1; i >= 0; --i) out.prepend(arr[i])
    for (let i = half; i < arr.length; ++i) out.append(arr[i])
    return out
  }
  static _mergeSort(array, callback) {
    const half = (array.length / 2) | 0.5
    if (array.length < 2) {
      return array
    }
    const left = array.splice(0, half)
    return Inventory._merge(
      Inventory._mergeSort(left, callback),
      Inventory._mergeSort(array, callback),
      callback
    )
  }
  static _binarySearch(arr, target, by, greather, start, end) {
    if (start > end) return undefined
    const index = ((start + end) / 2) | 0.5
    const current = arr.get(index)
    if (current === undefined) return undefined
    const identity = by(current)
    if (identity === target) return current
    if (greather(current))
      return Inventory._binarySearch(
        arr,
        target,
        by,
        greather,
        start,
        index - 1
      )
    else
      return Inventory._binarySearch(arr, target, by, greather, index + 1, end)
  }
  static _Identity(current) {
    return current
  }
  static _isEqual(a, b) {
    if (a === b) return true
    if (a && b && typeof a == 'object' && typeof b == 'object') {
      if (a.constructor !== b.constructor) return false
      let length, i, keys
      if (Inventory.isBrrr(a) && Inventory.isBrrr(b)) {
        length = a.length
        if (length != b.length) return false
        for (i = length; i-- !== 0; )
          if (!Inventory._isEqual(a.get(i), b.get(i))) return false
        return true
      }
      if (Array.isArray(a)) {
        length = a.length
        if (length != b.length) return false
        for (i = length; i-- !== 0; )
          if (!Inventory._isEqual(a[i], b[i])) return false
        return true
      }
      if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size) return false
        for (i of a.entries()) if (!b.has(i[0])) return false
        for (i of a.entries())
          if (!Inventory._isEqual(i[1], b.get(i[0]))) return false
        return true
      }
      if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size) return false
        for (i of a.entries()) if (!b.has(i[0])) return false
        return true
      }
      if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
        length = a.length
        if (length != b.length) return false
        for (i = length; i-- !== 0; ) if (a[i] !== b[i]) return false
        return true
      }
      if (a.constructor === RegExp)
        return a.source === b.source && a.flags === b.flags
      if (a.valueOf !== Object.prototype.valueOf)
        return a.valueOf() === b.valueOf()
      if (a.toString !== Object.prototype.toString)
        return a.toString() === b.toString()
      keys = Object.keys(a)
      length = keys.length
      if (length !== Object.keys(b).length) return false
      for (i = length; i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false
      for (i = length; i-- !== 0; ) {
        let key = keys[i]
        if (!Inventory._isEqual(a[key], b[key])) return false
      }
      return true
    }
    // true if both NaN, false otherwise
    return a !== a && b !== b
  }

  static _tco =
    (e) =>
    (...t) => {
      let r = e(...t)
      for (; 'function' == typeof r; ) r = r()
      return r
    }
  static _spreadArr = (e) => {
    if (!Inventory.isBrrr(e[0])) return e.reduce((e, t) => ({ ...e, ...t }), {})
    {
      let [t, ...r] = e
      return t.merge(...r)
    }
  }
  static _cast = (e) =>
    'string' == typeof e || void 0 == e ? Number(e) : e.toString()
  static _fill = (e) =>
    Inventory.from(
      Array.from({ length: e })
        .fill(null)
        .map((e, t) => t)
    )
  static _throw = (e, t) => {
    if (!e) throw Error(t + ' failed!')
  }
  static _checkType = (e, t) => e.constructor.name === t.constructor.name
  static _mapEntries = (e) =>
    Inventory.from([...e.entries()].map(Inventory.from))
  static _mapKeys = (e) => Inventory.from([...e.keys()])
  static _mapValues = (e) => Inventory.from([...e.values()])
  static _mapRemove = (e, t) => (e.delete(t), e)
  static _mapSet = (e, t, r) => (e.set(t, r), e)
  static _repeat = (e, t) => {
    let r
    for (let n = 0; n < e; ++n) r = t(n)
    return r
  }
  static _split = (e, t) => Inventory.from(e.split(t))
  static _call = (e, t) => t(e)
}
