//region block: polyfills
if (typeof Math.imul === 'undefined') {
  Math.imul = function imul(a, b) {
    return (a & 4.29490176E9) * (b & 65535) + (a & 65535) * (b | 0) | 0;
  };
}
if (typeof ArrayBuffer.isView === 'undefined') {
  ArrayBuffer.isView = function (a) {
    return a != null && a.__proto__ != null && a.__proto__.__proto__ === Int8Array.prototype.__proto__;
  };
}
if (typeof Array.prototype.fill === 'undefined') {
  // Polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill#Polyfill
  Object.defineProperty(Array.prototype, 'fill', {value: function (value) {
    // Steps 1-2.
    if (this == null) {
      throw new TypeError('this is null or not defined');
    }
    var O = Object(this); // Steps 3-5.
    var len = O.length >>> 0; // Steps 6-7.
    var start = arguments[1];
    var relativeStart = start >> 0; // Step 8.
    var k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len); // Steps 9-10.
    var end = arguments[2];
    var relativeEnd = end === undefined ? len : end >> 0; // Step 11.
    var finalValue = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len); // Step 12.
    while (k < finalValue) {
      O[k] = value;
      k++;
    }
    ; // Step 13.
    return O;
  }});
}
[Int8Array, Int16Array, Uint16Array, Int32Array, Float32Array, Float64Array].forEach(function (TypedArray) {
  if (typeof TypedArray.prototype.fill === 'undefined') {
    Object.defineProperty(TypedArray.prototype, 'fill', {value: Array.prototype.fill});
  }
});
if (typeof Math.clz32 === 'undefined') {
  Math.clz32 = function (log, LN2) {
    return function (x) {
      var asUint = x >>> 0;
      if (asUint === 0) {
        return 32;
      }
      return 31 - (log(asUint) / LN2 | 0) | 0; // the "| 0" acts like math.floor
    };
  }(Math.log, Math.LN2);
}
if (typeof Math.log10 === 'undefined') {
  Math.log10 = function (x) {
    return Math.log(x) * Math.LOG10E;
  };
}
if (typeof Math.log2 === 'undefined') {
  Math.log2 = function (x) {
    return Math.log(x) * Math.LOG2E;
  };
}
//endregion
//region block: imports
var imul_0 = Math.imul;
var isView = ArrayBuffer.isView;
var clz32 = Math.clz32;
//endregion
//region block: pre-declaration
initMetadataForInterface(CharSequence, 'CharSequence');
initMetadataForInterface(Comparable, 'Comparable');
initMetadataForClass(Number_0, 'Number');
initMetadataForClass(asIterable$$inlined$Iterable$1);
initMetadataForClass(Char, 'Char', VOID, VOID, [Comparable]);
initMetadataForCompanion(Companion);
initMetadataForInterface(Collection, 'Collection');
function asJsReadonlyArrayView() {
  return createJsReadonlyArrayViewFrom(this);
}
initMetadataForInterface(KtList_0, 'List', VOID, VOID, [Collection]);
initMetadataForInterface(Entry, 'Entry');
initMetadataForInterface(KtMap, 'Map');
initMetadataForInterface(KtSet, 'Set', VOID, VOID, [Collection]);
initMetadataForCompanion(Companion_0);
initMetadataForClass(Long, 'Long', VOID, Number_0, [Number_0, Comparable]);
initMetadataForInterface(FunctionAdapter, 'FunctionAdapter');
initMetadataForClass(arrayIterator$1);
initMetadataForClass(JsArrayView, 'JsArrayView', JsArrayView, Array);
initMetadataForObject(Digit, 'Digit');
initMetadataForInterface(Comparator, 'Comparator');
initMetadataForObject(Unit, 'Unit');
initMetadataForClass(AbstractCollection, 'AbstractCollection', VOID, VOID, [Collection]);
initMetadataForClass(AbstractMutableCollection, 'AbstractMutableCollection', VOID, AbstractCollection, [AbstractCollection, Collection]);
initMetadataForClass(IteratorImpl, 'IteratorImpl');
initMetadataForClass(ListIteratorImpl, 'ListIteratorImpl', VOID, IteratorImpl);
initMetadataForClass(AbstractMutableList, 'AbstractMutableList', VOID, AbstractMutableCollection, [AbstractMutableCollection, Collection, KtList_0]);
initMetadataForClass(SubList, 'SubList', VOID, AbstractMutableList);
initMetadataForClass(AbstractMap, 'AbstractMap', VOID, VOID, [KtMap]);
initMetadataForClass(AbstractMutableMap, 'AbstractMutableMap', VOID, AbstractMap, [AbstractMap, KtMap]);
initMetadataForClass(AbstractMutableSet, 'AbstractMutableSet', VOID, AbstractMutableCollection, [AbstractMutableCollection, KtSet, Collection]);
initMetadataForCompanion(Companion_1);
initMetadataForClass(ArrayList, 'ArrayList', ArrayList_init_$Create$, AbstractMutableList, [AbstractMutableList, Collection, KtList_0]);
initMetadataForClass(HashMap, 'HashMap', HashMap_init_$Create$, AbstractMutableMap, [AbstractMutableMap, KtMap]);
initMetadataForClass(HashMapKeys, 'HashMapKeys', VOID, AbstractMutableSet, [KtSet, Collection, AbstractMutableSet]);
initMetadataForClass(HashMapEntrySetBase, 'HashMapEntrySetBase', VOID, AbstractMutableSet, [KtSet, Collection, AbstractMutableSet]);
initMetadataForClass(HashMapEntrySet, 'HashMapEntrySet', VOID, HashMapEntrySetBase);
initMetadataForClass(HashMapKeysDefault$iterator$1);
initMetadataForClass(HashMapKeysDefault, 'HashMapKeysDefault', VOID, AbstractMutableSet);
initMetadataForClass(HashSet, 'HashSet', HashSet_init_$Create$, AbstractMutableSet, [AbstractMutableSet, KtSet, Collection]);
initMetadataForCompanion(Companion_2);
initMetadataForClass(Itr, 'Itr');
initMetadataForClass(KeysItr, 'KeysItr', VOID, Itr);
initMetadataForClass(EntriesItr, 'EntriesItr', VOID, Itr);
initMetadataForClass(EntryRef, 'EntryRef', VOID, VOID, [Entry]);
function containsAllEntries(m) {
  var tmp$ret$0;
  $l$block_0: {
    // Inline function 'kotlin.collections.all' call
    var tmp;
    if (isInterface(m, Collection)) {
      tmp = m.m();
    } else {
      tmp = false;
    }
    if (tmp) {
      tmp$ret$0 = true;
      break $l$block_0;
    }
    var _iterator__ex2g4s = m.j();
    while (_iterator__ex2g4s.k()) {
      var element = _iterator__ex2g4s.l();
      // Inline function 'kotlin.js.unsafeCast' call
      // Inline function 'kotlin.js.asDynamic' call
      var entry = element;
      var tmp_0;
      if (!(entry == null) ? isInterface(entry, Entry) : false) {
        tmp_0 = this.t5(entry);
      } else {
        tmp_0 = false;
      }
      if (!tmp_0) {
        tmp$ret$0 = false;
        break $l$block_0;
      }
    }
    tmp$ret$0 = true;
  }
  return tmp$ret$0;
}
initMetadataForInterface(InternalMap, 'InternalMap');
initMetadataForClass(InternalHashMap, 'InternalHashMap', InternalHashMap_init_$Create$, VOID, [InternalMap]);
initMetadataForClass(LinkedHashMap, 'LinkedHashMap', LinkedHashMap_init_$Create$, HashMap, [HashMap, KtMap]);
initMetadataForClass(LinkedHashSet, 'LinkedHashSet', LinkedHashSet_init_$Create$, HashSet, [HashSet, KtSet, Collection]);
initMetadataForClass(Exception, 'Exception', Exception_init_$Create$, Error);
initMetadataForClass(RuntimeException, 'RuntimeException', RuntimeException_init_$Create$, Exception);
initMetadataForClass(IllegalArgumentException, 'IllegalArgumentException', IllegalArgumentException_init_$Create$, RuntimeException);
initMetadataForClass(IllegalStateException, 'IllegalStateException', IllegalStateException_init_$Create$, RuntimeException);
initMetadataForClass(UnsupportedOperationException, 'UnsupportedOperationException', UnsupportedOperationException_init_$Create$, RuntimeException);
initMetadataForClass(NoSuchElementException, 'NoSuchElementException', NoSuchElementException_init_$Create$, RuntimeException);
initMetadataForClass(IndexOutOfBoundsException, 'IndexOutOfBoundsException', IndexOutOfBoundsException_init_$Create$, RuntimeException);
initMetadataForClass(ArithmeticException, 'ArithmeticException', ArithmeticException_init_$Create$, RuntimeException);
initMetadataForClass(NumberFormatException, 'NumberFormatException', NumberFormatException_init_$Create$, IllegalArgumentException);
initMetadataForClass(ConcurrentModificationException, 'ConcurrentModificationException', ConcurrentModificationException_init_$Create$, RuntimeException);
initMetadataForClass(NullPointerException, 'NullPointerException', NullPointerException_init_$Create$, RuntimeException);
initMetadataForClass(ClassCastException, 'ClassCastException', ClassCastException_init_$Create$, RuntimeException);
initMetadataForClass(StringBuilder, 'StringBuilder', StringBuilder_init_$Create$_0, VOID, [CharSequence]);
initMetadataForClass(sam$kotlin_Comparator$0, 'sam$kotlin_Comparator$0', VOID, VOID, [Comparator, FunctionAdapter]);
initMetadataForCompanion(Companion_3);
initMetadataForClass(AbstractMap$keys$1$iterator$1);
initMetadataForCompanion(Companion_4);
initMetadataForClass(AbstractSet, 'AbstractSet', VOID, AbstractCollection, [AbstractCollection, KtSet]);
initMetadataForClass(AbstractMap$keys$1, VOID, VOID, AbstractSet);
initMetadataForCompanion(Companion_5);
initMetadataForCompanion(Companion_6);
initMetadataForClass(ArrayDeque, 'ArrayDeque', ArrayDeque_init_$Create$, AbstractMutableList);
initMetadataForObject(EmptyList, 'EmptyList', VOID, VOID, [KtList_0]);
initMetadataForClass(ArrayAsCollection, 'ArrayAsCollection', VOID, VOID, [Collection]);
initMetadataForObject(EmptyIterator, 'EmptyIterator');
initMetadataForClass(IndexedValue, 'IndexedValue');
initMetadataForClass(IndexingIterable, 'IndexingIterable');
initMetadataForClass(IndexingIterator, 'IndexingIterator');
initMetadataForInterface(MapWithDefault, 'MapWithDefault', VOID, VOID, [KtMap]);
initMetadataForObject(EmptyMap, 'EmptyMap', VOID, VOID, [KtMap]);
initMetadataForClass(IntIterator, 'IntIterator');
initMetadataForObject(EmptySet, 'EmptySet', VOID, VOID, [KtSet]);
initMetadataForObject(NaturalOrderComparator, 'NaturalOrderComparator', VOID, VOID, [Comparator]);
initMetadataForCompanion(Companion_7);
initMetadataForClass(IntProgression, 'IntProgression');
initMetadataForClass(IntRange, 'IntRange', VOID, IntProgression);
initMetadataForClass(IntProgressionIterator, 'IntProgressionIterator', VOID, IntIterator);
initMetadataForCompanion(Companion_8);
initMetadataForClass(DelimitedRangesSequence$iterator$1);
initMetadataForClass(DelimitedRangesSequence, 'DelimitedRangesSequence');
initMetadataForClass(Pair, 'Pair');
//endregion
function CharSequence() {
}
function Comparable() {
}
function Number_0() {
}
function getOrNull(_this__u8e3s4, index) {
  return (0 <= index ? index <= (_this__u8e3s4.length - 1 | 0) : false) ? _this__u8e3s4[index] : null;
}
function contains(_this__u8e3s4, element) {
  return indexOf(_this__u8e3s4, element) >= 0;
}
function toList(_this__u8e3s4) {
  switch (_this__u8e3s4.length) {
    case 0:
      return emptyList();
    case 1:
      return listOf(_this__u8e3s4[0]);
    default:
      return toMutableList(_this__u8e3s4);
  }
}
function withIndex(_this__u8e3s4) {
  return new IndexingIterable(withIndex$lambda(_this__u8e3s4));
}
function min(_this__u8e3s4) {
  // Inline function 'kotlin.collections.isEmpty' call
  if (_this__u8e3s4.length === 0)
    throw NoSuchElementException_init_$Create$();
  var min = _this__u8e3s4[0];
  var inductionVariable = 1;
  var last = get_lastIndex(_this__u8e3s4);
  if (inductionVariable <= last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var e = _this__u8e3s4[i];
      if (compareTo(min, e) > 0)
        min = e;
    }
     while (!(i === last));
  return min;
}
function max(_this__u8e3s4) {
  // Inline function 'kotlin.collections.isEmpty' call
  if (_this__u8e3s4.length === 0)
    throw NoSuchElementException_init_$Create$();
  var max = _this__u8e3s4[0];
  var inductionVariable = 1;
  var last = get_lastIndex(_this__u8e3s4);
  if (inductionVariable <= last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var e = _this__u8e3s4[i];
      if (compareTo(max, e) < 0)
        max = e;
    }
     while (!(i === last));
  return max;
}
function toList_0(_this__u8e3s4) {
  switch (_this__u8e3s4.length) {
    case 0:
      return emptyList();
    case 1:
      return listOf(_this__u8e3s4[0]);
    default:
      return toMutableList_0(_this__u8e3s4);
  }
}
function sorted(_this__u8e3s4) {
  return asList(sortedArray(_this__u8e3s4));
}
function takeLast(_this__u8e3s4, n) {
  // Inline function 'kotlin.require' call
  if (!(n >= 0)) {
    var message = 'Requested element count ' + n + ' is less than zero.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  if (n === 0)
    return emptyList();
  var size = _this__u8e3s4.length;
  if (n >= size)
    return toList(_this__u8e3s4);
  if (n === 1)
    return listOf(_this__u8e3s4[size - 1 | 0]);
  var list = ArrayList_init_$Create$_0(n);
  var inductionVariable = size - n | 0;
  if (inductionVariable < size)
    do {
      var index = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      list.h(_this__u8e3s4[index]);
    }
     while (inductionVariable < size);
  return list;
}
function firstOrNull(_this__u8e3s4) {
  var tmp;
  // Inline function 'kotlin.collections.isEmpty' call
  if (_this__u8e3s4.length === 0) {
    tmp = null;
  } else {
    tmp = _this__u8e3s4[0];
  }
  return tmp;
}
function get_lastIndex(_this__u8e3s4) {
  return _this__u8e3s4.length - 1 | 0;
}
function indexOf(_this__u8e3s4, element) {
  if (element == null) {
    var inductionVariable = 0;
    var last = _this__u8e3s4.length - 1 | 0;
    if (inductionVariable <= last)
      do {
        var index = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        if (_this__u8e3s4[index] == null) {
          return index;
        }
      }
       while (inductionVariable <= last);
  } else {
    var inductionVariable_0 = 0;
    var last_0 = _this__u8e3s4.length - 1 | 0;
    if (inductionVariable_0 <= last_0)
      do {
        var index_0 = inductionVariable_0;
        inductionVariable_0 = inductionVariable_0 + 1 | 0;
        if (equals(element, _this__u8e3s4[index_0])) {
          return index_0;
        }
      }
       while (inductionVariable_0 <= last_0);
  }
  return -1;
}
function toMutableList(_this__u8e3s4) {
  return ArrayList_init_$Create$_1(asCollection(_this__u8e3s4));
}
function toMutableList_0(_this__u8e3s4) {
  var list = ArrayList_init_$Create$_0(_this__u8e3s4.length);
  var inductionVariable = 0;
  var last = _this__u8e3s4.length;
  while (inductionVariable < last) {
    var item = _this__u8e3s4[inductionVariable];
    inductionVariable = inductionVariable + 1 | 0;
    list.h(item);
  }
  return list;
}
function sortedArray(_this__u8e3s4) {
  // Inline function 'kotlin.collections.isEmpty' call
  if (_this__u8e3s4.length === 0)
    return _this__u8e3s4;
  // Inline function 'kotlin.collections.copyOf' call
  // Inline function 'kotlin.collections.copyOf' call
  // Inline function 'kotlin.js.asDynamic' call
  // Inline function 'kotlin.apply' call
  var this_0 = _this__u8e3s4.slice();
  sort(this_0);
  return this_0;
}
function lastIndexOf(_this__u8e3s4, element) {
  if (element == null) {
    var inductionVariable = _this__u8e3s4.length - 1 | 0;
    if (0 <= inductionVariable)
      do {
        var index = inductionVariable;
        inductionVariable = inductionVariable + -1 | 0;
        if (_this__u8e3s4[index] == null) {
          return index;
        }
      }
       while (0 <= inductionVariable);
  } else {
    var inductionVariable_0 = _this__u8e3s4.length - 1 | 0;
    if (0 <= inductionVariable_0)
      do {
        var index_0 = inductionVariable_0;
        inductionVariable_0 = inductionVariable_0 + -1 | 0;
        if (equals(element, _this__u8e3s4[index_0])) {
          return index_0;
        }
      }
       while (0 <= inductionVariable_0);
  }
  return -1;
}
function toSet(_this__u8e3s4) {
  switch (_this__u8e3s4.length) {
    case 0:
      return emptySet();
    case 1:
      return setOf(_this__u8e3s4[0]);
    default:
      return toCollection(_this__u8e3s4, LinkedHashSet_init_$Create$_1(mapCapacity(_this__u8e3s4.length)));
  }
}
function toCollection(_this__u8e3s4, destination) {
  var inductionVariable = 0;
  var last = _this__u8e3s4.length;
  while (inductionVariable < last) {
    var item = _this__u8e3s4[inductionVariable];
    inductionVariable = inductionVariable + 1 | 0;
    destination.h(item);
  }
  return destination;
}
function joinToString(_this__u8e3s4, separator, prefix, postfix, limit, truncated, transform) {
  separator = separator === VOID ? ', ' : separator;
  prefix = prefix === VOID ? '' : prefix;
  postfix = postfix === VOID ? '' : postfix;
  limit = limit === VOID ? -1 : limit;
  truncated = truncated === VOID ? '...' : truncated;
  transform = transform === VOID ? null : transform;
  return joinTo(_this__u8e3s4, StringBuilder_init_$Create$_0(), separator, prefix, postfix, limit, truncated, transform).toString();
}
function joinTo(_this__u8e3s4, buffer, separator, prefix, postfix, limit, truncated, transform) {
  separator = separator === VOID ? ', ' : separator;
  prefix = prefix === VOID ? '' : prefix;
  postfix = postfix === VOID ? '' : postfix;
  limit = limit === VOID ? -1 : limit;
  truncated = truncated === VOID ? '...' : truncated;
  transform = transform === VOID ? null : transform;
  buffer.i(prefix);
  var count = 0;
  var inductionVariable = 0;
  var last = _this__u8e3s4.length;
  $l$loop: while (inductionVariable < last) {
    var element = _this__u8e3s4[inductionVariable];
    inductionVariable = inductionVariable + 1 | 0;
    count = count + 1 | 0;
    if (count > 1) {
      buffer.i(separator);
    }
    if (limit < 0 || count <= limit) {
      appendElement(buffer, element, transform);
    } else
      break $l$loop;
  }
  if (limit >= 0 && count > limit) {
    buffer.i(truncated);
  }
  buffer.i(postfix);
  return buffer;
}
function withIndex$lambda($this_withIndex) {
  return function () {
    return arrayIterator($this_withIndex);
  };
}
function joinToString_0(_this__u8e3s4, separator, prefix, postfix, limit, truncated, transform) {
  separator = separator === VOID ? ', ' : separator;
  prefix = prefix === VOID ? '' : prefix;
  postfix = postfix === VOID ? '' : postfix;
  limit = limit === VOID ? -1 : limit;
  truncated = truncated === VOID ? '...' : truncated;
  transform = transform === VOID ? null : transform;
  return joinTo_0(_this__u8e3s4, StringBuilder_init_$Create$_0(), separator, prefix, postfix, limit, truncated, transform).toString();
}
function joinTo_0(_this__u8e3s4, buffer, separator, prefix, postfix, limit, truncated, transform) {
  separator = separator === VOID ? ', ' : separator;
  prefix = prefix === VOID ? '' : prefix;
  postfix = postfix === VOID ? '' : postfix;
  limit = limit === VOID ? -1 : limit;
  truncated = truncated === VOID ? '...' : truncated;
  transform = transform === VOID ? null : transform;
  buffer.i(prefix);
  var count = 0;
  var _iterator__ex2g4s = _this__u8e3s4.j();
  $l$loop: while (_iterator__ex2g4s.k()) {
    var element = _iterator__ex2g4s.l();
    count = count + 1 | 0;
    if (count > 1) {
      buffer.i(separator);
    }
    if (limit < 0 || count <= limit) {
      appendElement(buffer, element, transform);
    } else
      break $l$loop;
  }
  if (limit >= 0 && count > limit) {
    buffer.i(truncated);
  }
  buffer.i(postfix);
  return buffer;
}
function last(_this__u8e3s4) {
  if (_this__u8e3s4.m())
    throw NoSuchElementException_init_$Create$_0('List is empty.');
  return _this__u8e3s4.n(get_lastIndex_0(_this__u8e3s4));
}
function sorted_0(_this__u8e3s4) {
  if (isInterface(_this__u8e3s4, Collection)) {
    if (_this__u8e3s4.o() <= 1)
      return toList_1(_this__u8e3s4);
    // Inline function 'kotlin.collections.toTypedArray' call
    var tmp = copyToArray(_this__u8e3s4);
    // Inline function 'kotlin.apply' call
    var this_0 = isArray(tmp) ? tmp : THROW_CCE();
    sort(this_0);
    return asList(this_0);
  }
  // Inline function 'kotlin.apply' call
  var this_1 = toMutableList_1(_this__u8e3s4);
  sort_0(this_1);
  return this_1;
}
function min_0(_this__u8e3s4) {
  var iterator = _this__u8e3s4.j();
  if (!iterator.k())
    throw NoSuchElementException_init_$Create$();
  var min = iterator.l();
  while (iterator.k()) {
    var e = iterator.l();
    if (compareTo(min, e) > 0)
      min = e;
  }
  return min;
}
function max_0(_this__u8e3s4) {
  var iterator = _this__u8e3s4.j();
  if (!iterator.k())
    throw NoSuchElementException_init_$Create$();
  var max = iterator.l();
  while (iterator.k()) {
    var e = iterator.l();
    if (compareTo(max, e) < 0)
      max = e;
  }
  return max;
}
function getOrNull_0(_this__u8e3s4, index) {
  return (0 <= index ? index < _this__u8e3s4.o() : false) ? _this__u8e3s4.n(index) : null;
}
function sum(_this__u8e3s4) {
  var sum = 0.0;
  var _iterator__ex2g4s = _this__u8e3s4.j();
  while (_iterator__ex2g4s.k()) {
    var element = _iterator__ex2g4s.l();
    sum = sum + element;
  }
  return sum;
}
function plus(_this__u8e3s4, elements) {
  if (isInterface(elements, Collection)) {
    var result = ArrayList_init_$Create$_0(_this__u8e3s4.o() + elements.o() | 0);
    result.p(_this__u8e3s4);
    result.p(elements);
    return result;
  } else {
    var result_0 = ArrayList_init_$Create$_1(_this__u8e3s4);
    addAll(result_0, elements);
    return result_0;
  }
}
function distinct(_this__u8e3s4) {
  return toList_1(toMutableSet(_this__u8e3s4));
}
function plus_0(_this__u8e3s4, element) {
  var result = ArrayList_init_$Create$_0(_this__u8e3s4.o() + 1 | 0);
  result.p(_this__u8e3s4);
  result.h(element);
  return result;
}
function toSet_0(_this__u8e3s4) {
  if (isInterface(_this__u8e3s4, Collection)) {
    var tmp;
    switch (_this__u8e3s4.o()) {
      case 0:
        tmp = emptySet();
        break;
      case 1:
        var tmp_0;
        if (isInterface(_this__u8e3s4, KtList_0)) {
          tmp_0 = _this__u8e3s4.n(0);
        } else {
          tmp_0 = _this__u8e3s4.j().l();
        }

        tmp = setOf(tmp_0);
        break;
      default:
        tmp = toCollection_0(_this__u8e3s4, LinkedHashSet_init_$Create$_1(mapCapacity(_this__u8e3s4.o())));
        break;
    }
    return tmp;
  }
  return optimizeReadOnlySet(toCollection_0(_this__u8e3s4, LinkedHashSet_init_$Create$()));
}
function toList_1(_this__u8e3s4) {
  if (isInterface(_this__u8e3s4, Collection)) {
    var tmp;
    switch (_this__u8e3s4.o()) {
      case 0:
        tmp = emptyList();
        break;
      case 1:
        var tmp_0;
        if (isInterface(_this__u8e3s4, KtList_0)) {
          tmp_0 = _this__u8e3s4.n(0);
        } else {
          tmp_0 = _this__u8e3s4.j().l();
        }

        tmp = listOf(tmp_0);
        break;
      default:
        tmp = toMutableList_2(_this__u8e3s4);
        break;
    }
    return tmp;
  }
  return optimizeReadOnlyList(toMutableList_1(_this__u8e3s4));
}
function toMutableList_1(_this__u8e3s4) {
  if (isInterface(_this__u8e3s4, Collection))
    return toMutableList_2(_this__u8e3s4);
  return toCollection_0(_this__u8e3s4, ArrayList_init_$Create$());
}
function sortedWith(_this__u8e3s4, comparator) {
  if (isInterface(_this__u8e3s4, Collection)) {
    if (_this__u8e3s4.o() <= 1)
      return toList_1(_this__u8e3s4);
    // Inline function 'kotlin.collections.toTypedArray' call
    var tmp = copyToArray(_this__u8e3s4);
    // Inline function 'kotlin.apply' call
    var this_0 = isArray(tmp) ? tmp : THROW_CCE();
    sortWith(this_0, comparator);
    return asList(this_0);
  }
  // Inline function 'kotlin.apply' call
  var this_1 = toMutableList_1(_this__u8e3s4);
  sortWith_0(this_1, comparator);
  return this_1;
}
function toMutableSet(_this__u8e3s4) {
  var tmp;
  if (isInterface(_this__u8e3s4, Collection)) {
    tmp = LinkedHashSet_init_$Create$_0(_this__u8e3s4);
  } else {
    tmp = toCollection_0(_this__u8e3s4, LinkedHashSet_init_$Create$());
  }
  return tmp;
}
function toCollection_0(_this__u8e3s4, destination) {
  var _iterator__ex2g4s = _this__u8e3s4.j();
  while (_iterator__ex2g4s.k()) {
    var item = _iterator__ex2g4s.l();
    destination.h(item);
  }
  return destination;
}
function toMutableList_2(_this__u8e3s4) {
  return ArrayList_init_$Create$_1(_this__u8e3s4);
}
function single(_this__u8e3s4) {
  if (isInterface(_this__u8e3s4, KtList_0))
    return single_0(_this__u8e3s4);
  else {
    var iterator = _this__u8e3s4.j();
    if (!iterator.k())
      throw NoSuchElementException_init_$Create$_0('Collection is empty.');
    var single = iterator.l();
    if (iterator.k())
      throw IllegalArgumentException_init_$Create$_0('Collection has more than one element.');
    return single;
  }
}
function single_0(_this__u8e3s4) {
  var tmp;
  switch (_this__u8e3s4.o()) {
    case 0:
      throw NoSuchElementException_init_$Create$_0('List is empty.');
    case 1:
      tmp = _this__u8e3s4.n(0);
      break;
    default:
      throw IllegalArgumentException_init_$Create$_0('List has more than one element.');
  }
  return tmp;
}
function until(_this__u8e3s4, to) {
  if (to <= -2147483648)
    return Companion_getInstance_7().q_1;
  return numberRangeToNumber(_this__u8e3s4, to - 1 | 0);
}
function coerceIn(_this__u8e3s4, minimumValue, maximumValue) {
  if (minimumValue > maximumValue)
    throw IllegalArgumentException_init_$Create$_0('Cannot coerce value to an empty range: maximum ' + maximumValue + ' is less than minimum ' + minimumValue + '.');
  if (_this__u8e3s4 < minimumValue)
    return minimumValue;
  if (_this__u8e3s4 > maximumValue)
    return maximumValue;
  return _this__u8e3s4;
}
function coerceIn_0(_this__u8e3s4, minimumValue, maximumValue) {
  if (minimumValue > maximumValue)
    throw IllegalArgumentException_init_$Create$_0('Cannot coerce value to an empty range: maximum ' + maximumValue + ' is less than minimum ' + minimumValue + '.');
  if (_this__u8e3s4 < minimumValue)
    return minimumValue;
  if (_this__u8e3s4 > maximumValue)
    return maximumValue;
  return _this__u8e3s4;
}
function coerceIn_1(_this__u8e3s4, minimumValue, maximumValue) {
  if (minimumValue > maximumValue)
    throw IllegalArgumentException_init_$Create$_0('Cannot coerce value to an empty range: maximum ' + maximumValue + ' is less than minimum ' + minimumValue + '.');
  if (_this__u8e3s4 < minimumValue)
    return minimumValue;
  if (_this__u8e3s4 > maximumValue)
    return maximumValue;
  return _this__u8e3s4;
}
function coerceAtLeast(_this__u8e3s4, minimumValue) {
  return _this__u8e3s4 < minimumValue ? minimumValue : _this__u8e3s4;
}
function downTo(_this__u8e3s4, to) {
  return Companion_instance_8.r(_this__u8e3s4, to, -1);
}
function coerceAtMost(_this__u8e3s4, maximumValue) {
  return _this__u8e3s4 > maximumValue ? maximumValue : _this__u8e3s4;
}
function asIterable(_this__u8e3s4) {
  // Inline function 'kotlin.collections.Iterable' call
  return new asIterable$$inlined$Iterable$1(_this__u8e3s4);
}
function asIterable$$inlined$Iterable$1($this_asIterable) {
  this.s_1 = $this_asIterable;
}
protoOf(asIterable$$inlined$Iterable$1).j = function () {
  return this.s_1.j();
};
function takeLast_0(_this__u8e3s4, n) {
  // Inline function 'kotlin.require' call
  if (!(n >= 0)) {
    var message = 'Requested character count ' + n + ' is less than zero.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  var length = _this__u8e3s4.length;
  return substring_0(_this__u8e3s4, length - coerceAtMost(n, length) | 0);
}
function _Char___init__impl__6a9atx(value) {
  return value;
}
function _get_value__a43j40($this) {
  return $this;
}
function Char__compareTo_impl_ypi4mb($this, other) {
  return _get_value__a43j40($this) - _get_value__a43j40(other) | 0;
}
function Char__minus_impl_a2frrh($this, other) {
  return _get_value__a43j40($this) - _get_value__a43j40(other) | 0;
}
function Char__toInt_impl_vasixd($this) {
  return _get_value__a43j40($this);
}
function toString($this) {
  // Inline function 'kotlin.js.unsafeCast' call
  return String.fromCharCode(_get_value__a43j40($this));
}
function Char() {
}
protoOf(Companion).fromJsArray = function (array) {
  return createListFrom(array);
};
function Companion() {
}
var Companion_instance;
function Companion_getInstance() {
  return Companion_instance;
}
function KtList_0() {
}
function Collection() {
}
function Entry() {
}
function KtMap() {
}
function KtSet() {
}
function toString_0(_this__u8e3s4) {
  var tmp1_elvis_lhs = _this__u8e3s4 == null ? null : toString_1(_this__u8e3s4);
  return tmp1_elvis_lhs == null ? 'null' : tmp1_elvis_lhs;
}
function Companion_0() {
  Companion_instance_0 = this;
  this.g1_1 = new Long(0, -2147483648);
  this.h1_1 = new Long(-1, 2147483647);
  this.i1_1 = 8;
  this.j1_1 = 64;
}
var Companion_instance_0;
function Companion_getInstance_0() {
  if (Companion_instance_0 == null)
    new Companion_0();
  return Companion_instance_0;
}
function Long(low, high) {
  Companion_getInstance_0();
  Number_0.call(this);
  this.k1_1 = low;
  this.l1_1 = high;
}
protoOf(Long).m1 = function (other) {
  return compare(this, other);
};
protoOf(Long).d = function (other) {
  return this.m1(other instanceof Long ? other : THROW_CCE());
};
protoOf(Long).n1 = function (other) {
  return add(this, other);
};
protoOf(Long).o1 = function (other) {
  return divide(this, other);
};
protoOf(Long).p1 = function () {
  return this.q1().n1(new Long(1, 0));
};
protoOf(Long).r1 = function (other) {
  return new Long(this.k1_1 & other.k1_1, this.l1_1 & other.l1_1);
};
protoOf(Long).q1 = function () {
  return new Long(~this.k1_1, ~this.l1_1);
};
protoOf(Long).s1 = function () {
  return this.k1_1;
};
protoOf(Long).t1 = function () {
  return toNumber(this);
};
protoOf(Long).toString = function () {
  return toStringImpl(this, 10);
};
protoOf(Long).equals = function (other) {
  var tmp;
  if (other instanceof Long) {
    tmp = equalsLong(this, other);
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(Long).hashCode = function () {
  return hashCode_0(this);
};
protoOf(Long).valueOf = function () {
  return this.t1();
};
function implement(interfaces) {
  var maxSize = 1;
  var masks = [];
  var inductionVariable = 0;
  var last = interfaces.length;
  while (inductionVariable < last) {
    var i = interfaces[inductionVariable];
    inductionVariable = inductionVariable + 1 | 0;
    var currentSize = maxSize;
    var tmp0_elvis_lhs = i.prototype.$imask$;
    var imask = tmp0_elvis_lhs == null ? i.$imask$ : tmp0_elvis_lhs;
    if (!(imask == null)) {
      masks.push(imask);
      currentSize = imask.length;
    }
    var iid = i.$metadata$.iid;
    var tmp;
    if (iid == null) {
      tmp = null;
    } else {
      // Inline function 'kotlin.let' call
      tmp = bitMaskWith(iid);
    }
    var iidImask = tmp;
    if (!(iidImask == null)) {
      masks.push(iidImask);
      currentSize = Math.max(currentSize, iidImask.length);
    }
    if (currentSize > maxSize) {
      maxSize = currentSize;
    }
  }
  return compositeBitMask(maxSize, masks);
}
function bitMaskWith(activeBit) {
  var numberIndex = activeBit >> 5;
  var intArray = new Int32Array(numberIndex + 1 | 0);
  var positionInNumber = activeBit & 31;
  var numberWithSettledBit = 1 << positionInNumber;
  intArray[numberIndex] = intArray[numberIndex] | numberWithSettledBit;
  return intArray;
}
function compositeBitMask(capacity, masks) {
  var tmp = 0;
  var tmp_0 = new Int32Array(capacity);
  while (tmp < capacity) {
    var tmp_1 = tmp;
    var result = 0;
    var inductionVariable = 0;
    var last = masks.length;
    while (inductionVariable < last) {
      var mask = masks[inductionVariable];
      inductionVariable = inductionVariable + 1 | 0;
      if (tmp_1 < mask.length) {
        result = result | mask[tmp_1];
      }
    }
    tmp_0[tmp_1] = result;
    tmp = tmp + 1 | 0;
  }
  return tmp_0;
}
function isBitSet(_this__u8e3s4, possibleActiveBit) {
  var numberIndex = possibleActiveBit >> 5;
  if (numberIndex > _this__u8e3s4.length)
    return false;
  var positionInNumber = possibleActiveBit & 31;
  var numberWithSettledBit = 1 << positionInNumber;
  return !((_this__u8e3s4[numberIndex] & numberWithSettledBit) === 0);
}
function FunctionAdapter() {
}
function arrayIterator(array) {
  return new arrayIterator$1(array);
}
function arrayIterator$1($array) {
  this.w1_1 = $array;
  this.v1_1 = 0;
}
protoOf(arrayIterator$1).k = function () {
  return !(this.v1_1 === this.w1_1.length);
};
protoOf(arrayIterator$1).l = function () {
  var tmp;
  if (!(this.v1_1 === this.w1_1.length)) {
    var _unary__edvuaz = this.v1_1;
    this.v1_1 = _unary__edvuaz + 1 | 0;
    tmp = this.w1_1[_unary__edvuaz];
  } else {
    throw NoSuchElementException_init_$Create$_0('' + this.v1_1);
  }
  return tmp;
};
function get_buf() {
  _init_properties_bitUtils_kt__nfcg4k();
  return buf;
}
var buf;
function get_bufFloat64() {
  _init_properties_bitUtils_kt__nfcg4k();
  return bufFloat64;
}
var bufFloat64;
var bufFloat32;
function get_bufInt32() {
  _init_properties_bitUtils_kt__nfcg4k();
  return bufInt32;
}
var bufInt32;
function get_lowIndex() {
  _init_properties_bitUtils_kt__nfcg4k();
  return lowIndex;
}
var lowIndex;
function get_highIndex() {
  _init_properties_bitUtils_kt__nfcg4k();
  return highIndex;
}
var highIndex;
function getNumberHashCode(obj) {
  _init_properties_bitUtils_kt__nfcg4k();
  // Inline function 'kotlin.js.jsBitwiseOr' call
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  if ((obj | 0) === obj) {
    return numberToInt(obj);
  }
  get_bufFloat64()[0] = obj;
  return imul_0(get_bufInt32()[get_highIndex()], 31) + get_bufInt32()[get_lowIndex()] | 0;
}
var properties_initialized_bitUtils_kt_i2bo3e;
function _init_properties_bitUtils_kt__nfcg4k() {
  if (!properties_initialized_bitUtils_kt_i2bo3e) {
    properties_initialized_bitUtils_kt_i2bo3e = true;
    buf = new ArrayBuffer(8);
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    bufFloat64 = new Float64Array(get_buf());
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    bufFloat32 = new Float32Array(get_buf());
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    bufInt32 = new Int32Array(get_buf());
    // Inline function 'kotlin.run' call
    get_bufFloat64()[0] = -1.0;
    lowIndex = !(get_bufInt32()[0] === 0) ? 1 : 0;
    highIndex = 1 - get_lowIndex() | 0;
  }
}
function charSequenceGet(a, index) {
  var tmp;
  if (isString(a)) {
    tmp = charCodeAt(a, index);
  } else {
    tmp = a.b(index);
  }
  return tmp;
}
function isString(a) {
  return typeof a === 'string';
}
function charCodeAt(_this__u8e3s4, index) {
  // Inline function 'kotlin.js.asDynamic' call
  return _this__u8e3s4.charCodeAt(index);
}
function charSequenceLength(a) {
  var tmp;
  if (isString(a)) {
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    tmp = a.length;
  } else {
    tmp = a.a();
  }
  return tmp;
}
function charSequenceSubSequence(a, startIndex, endIndex) {
  var tmp;
  if (isString(a)) {
    tmp = substring(a, startIndex, endIndex);
  } else {
    tmp = a.c(startIndex, endIndex);
  }
  return tmp;
}
function arrayToString(array) {
  return joinToString(array, ', ', '[', ']', VOID, VOID, arrayToString$lambda);
}
function arrayToString$lambda(it) {
  return toString_1(it);
}
function createJsReadonlyArrayViewFrom(list) {
  var tmp = createJsReadonlyArrayViewFrom$lambda(list);
  var tmp_0 = createJsReadonlyArrayViewFrom$lambda_0(list);
  // Inline function 'kotlin.js.asDynamic' call
  var tmp_1 = UNSUPPORTED_OPERATION$ref();
  // Inline function 'kotlin.js.asDynamic' call
  var tmp_2 = UNSUPPORTED_OPERATION$ref_0();
  // Inline function 'kotlin.js.asDynamic' call
  var tmp$ret$2 = UNSUPPORTED_OPERATION$ref_1();
  return createJsArrayViewWith(tmp, tmp_0, tmp_1, tmp_2, tmp$ret$2);
}
function createJsArrayViewWith(listSize, listGet, listSet, listDecreaseSize, listIncreaseSize) {
  var arrayView = new Array();
  var tmp = Object;
  // Inline function 'kotlin.js.asDynamic' call
  var tmp$ret$0 = JsArrayView;
  tmp.setPrototypeOf(arrayView, tmp$ret$0.prototype);
  return new Proxy(arrayView, {get: function (target, prop, receiver) {
    if (prop === 'length')
      return listSize();
    var type = typeof prop;
    var index = type === 'string' || type === 'number' ? +prop : undefined;
    if (!isNaN(index))
      return listGet(index);
    return target[prop];
  }, has: function (target, key) {
    return !isNaN(key) && key < listSize();
  }, set: function (obj, prop, value) {
    if (prop === 'length') {
      var size = listSize();
      var newSize = type === 'string' || type === 'number' ? +prop : undefined;
      if (isNaN(newSize))
        throw new RangeError('invalid array length');
      if (newSize < size)
        listDecreaseSize(size - newSize);
      else
        listIncreaseSize(newSize - size);
      return true;
    }
    var type = typeof prop;
    var index = type === 'string' || type === 'number' ? +prop : undefined;
    if (isNaN(index))
      return false;
    listSet(index, value);
    return true;
  }});
}
function UNSUPPORTED_OPERATION() {
  throw UnsupportedOperationException_init_$Create$();
}
function JsArrayView() {
  Array.call(this);
}
function createListFrom(array) {
  // Inline function 'kotlin.js.asDynamic' call
  // Inline function 'kotlin.js.unsafeCast' call
  var tmp$ret$1 = array.slice();
  return (new ArrayList(tmp$ret$1)).x1();
}
function createJsReadonlyArrayViewFrom$lambda($list) {
  return function () {
    return $list.o();
  };
}
function createJsReadonlyArrayViewFrom$lambda_0($list) {
  return function (i) {
    return $list.n(i);
  };
}
function UNSUPPORTED_OPERATION$ref() {
  var l = function () {
    UNSUPPORTED_OPERATION();
    return Unit_instance;
  };
  l.callableName = 'UNSUPPORTED_OPERATION';
  return l;
}
function UNSUPPORTED_OPERATION$ref_0() {
  var l = function () {
    UNSUPPORTED_OPERATION();
    return Unit_instance;
  };
  l.callableName = 'UNSUPPORTED_OPERATION';
  return l;
}
function UNSUPPORTED_OPERATION$ref_1() {
  var l = function () {
    UNSUPPORTED_OPERATION();
    return Unit_instance;
  };
  l.callableName = 'UNSUPPORTED_OPERATION';
  return l;
}
function compareTo(a, b) {
  var tmp;
  switch (typeof a) {
    case 'number':
      var tmp_0;
      if (typeof b === 'number') {
        tmp_0 = doubleCompareTo(a, b);
      } else {
        if (b instanceof Long) {
          tmp_0 = doubleCompareTo(a, b.t1());
        } else {
          tmp_0 = primitiveCompareTo(a, b);
        }
      }

      tmp = tmp_0;
      break;
    case 'string':
    case 'boolean':
      tmp = primitiveCompareTo(a, b);
      break;
    default:
      tmp = compareToDoNotIntrinsicify(a, b);
      break;
  }
  return tmp;
}
function doubleCompareTo(a, b) {
  var tmp;
  if (a < b) {
    tmp = -1;
  } else if (a > b) {
    tmp = 1;
  } else if (a === b) {
    var tmp_0;
    if (a !== 0) {
      tmp_0 = 0;
    } else {
      // Inline function 'kotlin.js.asDynamic' call
      var ia = 1 / a;
      var tmp_1;
      // Inline function 'kotlin.js.asDynamic' call
      if (ia === 1 / b) {
        tmp_1 = 0;
      } else {
        if (ia < 0) {
          tmp_1 = -1;
        } else {
          tmp_1 = 1;
        }
      }
      tmp_0 = tmp_1;
    }
    tmp = tmp_0;
  } else if (a !== a) {
    tmp = b !== b ? 0 : 1;
  } else {
    tmp = -1;
  }
  return tmp;
}
function primitiveCompareTo(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
function compareToDoNotIntrinsicify(a, b) {
  return a.d(b);
}
function getObjectHashCode(obj) {
  // Inline function 'kotlin.js.jsIn' call
  if (!('kotlinHashCodeValue$' in obj)) {
    var hash = calculateRandomHash();
    var descriptor = new Object();
    descriptor.value = hash;
    descriptor.enumerable = false;
    Object.defineProperty(obj, 'kotlinHashCodeValue$', descriptor);
  }
  // Inline function 'kotlin.js.unsafeCast' call
  return obj['kotlinHashCodeValue$'];
}
function calculateRandomHash() {
  // Inline function 'kotlin.js.jsBitwiseOr' call
  return Math.random() * 4.294967296E9 | 0;
}
function toString_1(o) {
  var tmp;
  if (o == null) {
    tmp = 'null';
  } else if (isArrayish(o)) {
    tmp = '[...]';
  } else if (!(typeof o.toString === 'function')) {
    tmp = anyToString(o);
  } else {
    // Inline function 'kotlin.js.unsafeCast' call
    tmp = o.toString();
  }
  return tmp;
}
function objectCreate(proto) {
  proto = proto === VOID ? null : proto;
  return Object.create(proto);
}
function defineProp(obj, name, getter, setter) {
  return Object.defineProperty(obj, name, {configurable: true, get: getter, set: setter});
}
function anyToString(o) {
  return Object.prototype.toString.call(o);
}
function hashCode(obj) {
  if (obj == null)
    return 0;
  var typeOf = typeof obj;
  var tmp;
  switch (typeOf) {
    case 'object':
      tmp = 'function' === typeof obj.hashCode ? obj.hashCode() : getObjectHashCode(obj);
      break;
    case 'function':
      tmp = getObjectHashCode(obj);
      break;
    case 'number':
      tmp = getNumberHashCode(obj);
      break;
    case 'boolean':
      // Inline function 'kotlin.js.unsafeCast' call

      tmp = getBooleanHashCode(obj);
      break;
    case 'string':
      tmp = getStringHashCode(String(obj));
      break;
    case 'bigint':
      tmp = getBigIntHashCode(obj);
      break;
    case 'symbol':
      tmp = getSymbolHashCode(obj);
      break;
    default:
      tmp = function () {
        throw new Error('Unexpected typeof `' + typeOf + '`');
      }();
      break;
  }
  return tmp;
}
function getBooleanHashCode(value) {
  return value ? 1231 : 1237;
}
function getStringHashCode(str) {
  var hash = 0;
  var length = str.length;
  var inductionVariable = 0;
  var last = length - 1 | 0;
  if (inductionVariable <= last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      // Inline function 'kotlin.js.asDynamic' call
      var code = str.charCodeAt(i);
      hash = imul_0(hash, 31) + code | 0;
    }
     while (!(i === last));
  return hash;
}
function getBigIntHashCode(value) {
  var shiftNumber = BigInt(32);
  var MASK = BigInt(4.294967295E9);
  var bigNumber = value < 0 ? -value : value;
  var hashCode = 0;
  var signum = value < 0 ? -1 : 1;
  while (bigNumber != 0) {
    // Inline function 'kotlin.js.unsafeCast' call
    var chunk = Number(bigNumber & MASK);
    hashCode = imul_0(31, hashCode) + chunk | 0;
    bigNumber = bigNumber >> shiftNumber;
  }
  return imul_0(hashCode, signum);
}
function getSymbolHashCode(value) {
  var hashCodeMap = symbolIsSharable(value) ? getSymbolMap() : getSymbolWeakMap();
  var cachedHashCode = hashCodeMap.get(value);
  if (cachedHashCode !== VOID)
    return cachedHashCode;
  var hash = calculateRandomHash();
  hashCodeMap.set(value, hash);
  return hash;
}
function symbolIsSharable(symbol) {
  return Symbol.keyFor(symbol) != VOID;
}
function getSymbolMap() {
  if (symbolMap === VOID) {
    symbolMap = new Map();
  }
  return symbolMap;
}
function getSymbolWeakMap() {
  if (symbolWeakMap === VOID) {
    symbolWeakMap = new WeakMap();
  }
  return symbolWeakMap;
}
var symbolMap;
var symbolWeakMap;
function equals(obj1, obj2) {
  if (obj1 == null) {
    return obj2 == null;
  }
  if (obj2 == null) {
    return false;
  }
  if (typeof obj1 === 'object' && typeof obj1.equals === 'function') {
    return obj1.equals(obj2);
  }
  if (obj1 !== obj1) {
    return obj2 !== obj2;
  }
  if (typeof obj1 === 'number' && typeof obj2 === 'number') {
    var tmp;
    if (obj1 === obj2) {
      var tmp_0;
      if (obj1 !== 0) {
        tmp_0 = true;
      } else {
        // Inline function 'kotlin.js.asDynamic' call
        var tmp_1 = 1 / obj1;
        // Inline function 'kotlin.js.asDynamic' call
        tmp_0 = tmp_1 === 1 / obj2;
      }
      tmp = tmp_0;
    } else {
      tmp = false;
    }
    return tmp;
  }
  return obj1 === obj2;
}
function unboxIntrinsic(x) {
  var message = 'Should be lowered';
  throw IllegalStateException_init_$Create$_0(toString_1(message));
}
function captureStack(instance, constructorFunction) {
  if (Error.captureStackTrace != null) {
    Error.captureStackTrace(instance, constructorFunction);
  } else {
    // Inline function 'kotlin.js.asDynamic' call
    instance.stack = (new Error()).stack;
  }
}
function protoOf(constructor) {
  return constructor.prototype;
}
function defineMessage(message, cause) {
  var tmp;
  if (isUndefined(message)) {
    var tmp_0;
    if (isUndefined(cause)) {
      tmp_0 = message;
    } else {
      var tmp1_elvis_lhs = cause == null ? null : cause.toString();
      tmp_0 = tmp1_elvis_lhs == null ? VOID : tmp1_elvis_lhs;
    }
    tmp = tmp_0;
  } else {
    tmp = message == null ? VOID : message;
  }
  return tmp;
}
function isUndefined(value) {
  return value === VOID;
}
function extendThrowable(this_, message, cause) {
  defineFieldOnInstance(this_, 'message', defineMessage(message, cause));
  defineFieldOnInstance(this_, 'cause', cause);
  defineFieldOnInstance(this_, 'name', Object.getPrototypeOf(this_).constructor.name);
}
function defineFieldOnInstance(this_, name, value) {
  Object.defineProperty(this_, name, {configurable: true, writable: true, value: value});
}
function ensureNotNull(v) {
  var tmp;
  if (v == null) {
    THROW_NPE();
  } else {
    tmp = v;
  }
  return tmp;
}
function THROW_NPE() {
  throw NullPointerException_init_$Create$();
}
function THROW_CCE() {
  throw ClassCastException_init_$Create$();
}
function get_ZERO() {
  _init_properties_longJs_kt__elc2w5();
  return ZERO;
}
var ZERO;
function get_ONE() {
  _init_properties_longJs_kt__elc2w5();
  return ONE;
}
var ONE;
function get_NEG_ONE() {
  _init_properties_longJs_kt__elc2w5();
  return NEG_ONE;
}
var NEG_ONE;
function get_MAX_VALUE() {
  _init_properties_longJs_kt__elc2w5();
  return MAX_VALUE;
}
var MAX_VALUE;
function get_MIN_VALUE() {
  _init_properties_longJs_kt__elc2w5();
  return MIN_VALUE;
}
var MIN_VALUE;
function get_TWO_PWR_24_() {
  _init_properties_longJs_kt__elc2w5();
  return TWO_PWR_24_;
}
var TWO_PWR_24_;
function compare(_this__u8e3s4, other) {
  _init_properties_longJs_kt__elc2w5();
  if (equalsLong(_this__u8e3s4, other)) {
    return 0;
  }
  var thisNeg = isNegative(_this__u8e3s4);
  var otherNeg = isNegative(other);
  return thisNeg && !otherNeg ? -1 : !thisNeg && otherNeg ? 1 : isNegative(subtract(_this__u8e3s4, other)) ? -1 : 1;
}
function add(_this__u8e3s4, other) {
  _init_properties_longJs_kt__elc2w5();
  var a48 = _this__u8e3s4.l1_1 >>> 16 | 0;
  var a32 = _this__u8e3s4.l1_1 & 65535;
  var a16 = _this__u8e3s4.k1_1 >>> 16 | 0;
  var a00 = _this__u8e3s4.k1_1 & 65535;
  var b48 = other.l1_1 >>> 16 | 0;
  var b32 = other.l1_1 & 65535;
  var b16 = other.k1_1 >>> 16 | 0;
  var b00 = other.k1_1 & 65535;
  var c48 = 0;
  var c32 = 0;
  var c16 = 0;
  var c00 = 0;
  c00 = c00 + (a00 + b00 | 0) | 0;
  c16 = c16 + (c00 >>> 16 | 0) | 0;
  c00 = c00 & 65535;
  c16 = c16 + (a16 + b16 | 0) | 0;
  c32 = c32 + (c16 >>> 16 | 0) | 0;
  c16 = c16 & 65535;
  c32 = c32 + (a32 + b32 | 0) | 0;
  c48 = c48 + (c32 >>> 16 | 0) | 0;
  c32 = c32 & 65535;
  c48 = c48 + (a48 + b48 | 0) | 0;
  c48 = c48 & 65535;
  return new Long(c16 << 16 | c00, c48 << 16 | c32);
}
function subtract(_this__u8e3s4, other) {
  _init_properties_longJs_kt__elc2w5();
  return add(_this__u8e3s4, other.p1());
}
function multiply(_this__u8e3s4, other) {
  _init_properties_longJs_kt__elc2w5();
  if (isZero(_this__u8e3s4)) {
    return get_ZERO();
  } else if (isZero(other)) {
    return get_ZERO();
  }
  if (equalsLong(_this__u8e3s4, get_MIN_VALUE())) {
    return isOdd(other) ? get_MIN_VALUE() : get_ZERO();
  } else if (equalsLong(other, get_MIN_VALUE())) {
    return isOdd(_this__u8e3s4) ? get_MIN_VALUE() : get_ZERO();
  }
  if (isNegative(_this__u8e3s4)) {
    var tmp;
    if (isNegative(other)) {
      tmp = multiply(negate(_this__u8e3s4), negate(other));
    } else {
      tmp = negate(multiply(negate(_this__u8e3s4), other));
    }
    return tmp;
  } else if (isNegative(other)) {
    return negate(multiply(_this__u8e3s4, negate(other)));
  }
  if (lessThan(_this__u8e3s4, get_TWO_PWR_24_()) && lessThan(other, get_TWO_PWR_24_())) {
    return fromNumber(toNumber(_this__u8e3s4) * toNumber(other));
  }
  var a48 = _this__u8e3s4.l1_1 >>> 16 | 0;
  var a32 = _this__u8e3s4.l1_1 & 65535;
  var a16 = _this__u8e3s4.k1_1 >>> 16 | 0;
  var a00 = _this__u8e3s4.k1_1 & 65535;
  var b48 = other.l1_1 >>> 16 | 0;
  var b32 = other.l1_1 & 65535;
  var b16 = other.k1_1 >>> 16 | 0;
  var b00 = other.k1_1 & 65535;
  var c48 = 0;
  var c32 = 0;
  var c16 = 0;
  var c00 = 0;
  c00 = c00 + imul_0(a00, b00) | 0;
  c16 = c16 + (c00 >>> 16 | 0) | 0;
  c00 = c00 & 65535;
  c16 = c16 + imul_0(a16, b00) | 0;
  c32 = c32 + (c16 >>> 16 | 0) | 0;
  c16 = c16 & 65535;
  c16 = c16 + imul_0(a00, b16) | 0;
  c32 = c32 + (c16 >>> 16 | 0) | 0;
  c16 = c16 & 65535;
  c32 = c32 + imul_0(a32, b00) | 0;
  c48 = c48 + (c32 >>> 16 | 0) | 0;
  c32 = c32 & 65535;
  c32 = c32 + imul_0(a16, b16) | 0;
  c48 = c48 + (c32 >>> 16 | 0) | 0;
  c32 = c32 & 65535;
  c32 = c32 + imul_0(a00, b32) | 0;
  c48 = c48 + (c32 >>> 16 | 0) | 0;
  c32 = c32 & 65535;
  c48 = c48 + (((imul_0(a48, b00) + imul_0(a32, b16) | 0) + imul_0(a16, b32) | 0) + imul_0(a00, b48) | 0) | 0;
  c48 = c48 & 65535;
  return new Long(c16 << 16 | c00, c48 << 16 | c32);
}
function divide(_this__u8e3s4, other) {
  _init_properties_longJs_kt__elc2w5();
  if (isZero(other)) {
    throw Exception_init_$Create$_0('division by zero');
  } else if (isZero(_this__u8e3s4)) {
    return get_ZERO();
  }
  if (equalsLong(_this__u8e3s4, get_MIN_VALUE())) {
    if (equalsLong(other, get_ONE()) || equalsLong(other, get_NEG_ONE())) {
      return get_MIN_VALUE();
    } else if (equalsLong(other, get_MIN_VALUE())) {
      return get_ONE();
    } else {
      var halfThis = shiftRight(_this__u8e3s4, 1);
      var approx = shiftLeft(halfThis.o1(other), 1);
      if (equalsLong(approx, get_ZERO())) {
        return isNegative(other) ? get_ONE() : get_NEG_ONE();
      } else {
        var rem = subtract(_this__u8e3s4, multiply(other, approx));
        return add(approx, rem.o1(other));
      }
    }
  } else if (equalsLong(other, get_MIN_VALUE())) {
    return get_ZERO();
  }
  if (isNegative(_this__u8e3s4)) {
    var tmp;
    if (isNegative(other)) {
      tmp = negate(_this__u8e3s4).o1(negate(other));
    } else {
      tmp = negate(negate(_this__u8e3s4).o1(other));
    }
    return tmp;
  } else if (isNegative(other)) {
    return negate(_this__u8e3s4.o1(negate(other)));
  }
  var res = get_ZERO();
  var rem_0 = _this__u8e3s4;
  while (greaterThanOrEqual(rem_0, other)) {
    var approxDouble = toNumber(rem_0) / toNumber(other);
    var approx2 = Math.max(1.0, Math.floor(approxDouble));
    var log2 = Math.ceil(Math.log(approx2) / Math.LN2);
    var delta = log2 <= 48 ? 1.0 : Math.pow(2.0, log2 - 48);
    var approxRes = fromNumber(approx2);
    var approxRem = multiply(approxRes, other);
    while (isNegative(approxRem) || greaterThan(approxRem, rem_0)) {
      approx2 = approx2 - delta;
      approxRes = fromNumber(approx2);
      approxRem = multiply(approxRes, other);
    }
    if (isZero(approxRes)) {
      approxRes = get_ONE();
    }
    res = add(res, approxRes);
    rem_0 = subtract(rem_0, approxRem);
  }
  return res;
}
function shiftLeft(_this__u8e3s4, numBits) {
  _init_properties_longJs_kt__elc2w5();
  var numBits_0 = numBits & 63;
  if (numBits_0 === 0) {
    return _this__u8e3s4;
  } else {
    if (numBits_0 < 32) {
      return new Long(_this__u8e3s4.k1_1 << numBits_0, _this__u8e3s4.l1_1 << numBits_0 | (_this__u8e3s4.k1_1 >>> (32 - numBits_0 | 0) | 0));
    } else {
      return new Long(0, _this__u8e3s4.k1_1 << (numBits_0 - 32 | 0));
    }
  }
}
function shiftRight(_this__u8e3s4, numBits) {
  _init_properties_longJs_kt__elc2w5();
  var numBits_0 = numBits & 63;
  if (numBits_0 === 0) {
    return _this__u8e3s4;
  } else {
    if (numBits_0 < 32) {
      return new Long(_this__u8e3s4.k1_1 >>> numBits_0 | 0 | _this__u8e3s4.l1_1 << (32 - numBits_0 | 0), _this__u8e3s4.l1_1 >> numBits_0);
    } else {
      return new Long(_this__u8e3s4.l1_1 >> (numBits_0 - 32 | 0), _this__u8e3s4.l1_1 >= 0 ? 0 : -1);
    }
  }
}
function toNumber(_this__u8e3s4) {
  _init_properties_longJs_kt__elc2w5();
  return _this__u8e3s4.l1_1 * 4.294967296E9 + getLowBitsUnsigned(_this__u8e3s4);
}
function toStringImpl(_this__u8e3s4, radix) {
  _init_properties_longJs_kt__elc2w5();
  if (radix < 2 || 36 < radix) {
    throw Exception_init_$Create$_0('radix out of range: ' + radix);
  }
  if (isZero(_this__u8e3s4)) {
    return '0';
  }
  if (isNegative(_this__u8e3s4)) {
    if (equalsLong(_this__u8e3s4, get_MIN_VALUE())) {
      var radixLong = fromInt(radix);
      var div = _this__u8e3s4.o1(radixLong);
      var rem = subtract(multiply(div, radixLong), _this__u8e3s4).s1();
      var tmp = toStringImpl(div, radix);
      // Inline function 'kotlin.js.asDynamic' call
      // Inline function 'kotlin.js.unsafeCast' call
      return tmp + rem.toString(radix);
    } else {
      return '-' + toStringImpl(negate(_this__u8e3s4), radix);
    }
  }
  var digitsPerTime = radix === 2 ? 31 : radix <= 10 ? 9 : radix <= 21 ? 7 : radix <= 35 ? 6 : 5;
  var radixToPower = fromNumber(Math.pow(radix, digitsPerTime));
  var rem_0 = _this__u8e3s4;
  var result = '';
  while (true) {
    var remDiv = rem_0.o1(radixToPower);
    var intval = subtract(rem_0, multiply(remDiv, radixToPower)).s1();
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    var digits = intval.toString(radix);
    rem_0 = remDiv;
    if (isZero(rem_0)) {
      return digits + result;
    } else {
      while (digits.length < digitsPerTime) {
        digits = '0' + digits;
      }
      result = digits + result;
    }
  }
}
function equalsLong(_this__u8e3s4, other) {
  _init_properties_longJs_kt__elc2w5();
  return _this__u8e3s4.l1_1 === other.l1_1 && _this__u8e3s4.k1_1 === other.k1_1;
}
function hashCode_0(l) {
  _init_properties_longJs_kt__elc2w5();
  return l.k1_1 ^ l.l1_1;
}
function fromInt(value) {
  _init_properties_longJs_kt__elc2w5();
  return new Long(value, value < 0 ? -1 : 0);
}
function isNegative(_this__u8e3s4) {
  _init_properties_longJs_kt__elc2w5();
  return _this__u8e3s4.l1_1 < 0;
}
function isZero(_this__u8e3s4) {
  _init_properties_longJs_kt__elc2w5();
  return _this__u8e3s4.l1_1 === 0 && _this__u8e3s4.k1_1 === 0;
}
function isOdd(_this__u8e3s4) {
  _init_properties_longJs_kt__elc2w5();
  return (_this__u8e3s4.k1_1 & 1) === 1;
}
function negate(_this__u8e3s4) {
  _init_properties_longJs_kt__elc2w5();
  return _this__u8e3s4.p1();
}
function lessThan(_this__u8e3s4, other) {
  _init_properties_longJs_kt__elc2w5();
  return compare(_this__u8e3s4, other) < 0;
}
function fromNumber(value) {
  _init_properties_longJs_kt__elc2w5();
  if (isNaN_0(value)) {
    return get_ZERO();
  } else if (value <= -9.223372036854776E18) {
    return get_MIN_VALUE();
  } else if (value + 1 >= 9.223372036854776E18) {
    return get_MAX_VALUE();
  } else if (value < 0) {
    return negate(fromNumber(-value));
  } else {
    var twoPwr32 = 4.294967296E9;
    // Inline function 'kotlin.js.jsBitwiseOr' call
    var tmp = value % twoPwr32 | 0;
    // Inline function 'kotlin.js.jsBitwiseOr' call
    var tmp$ret$1 = value / twoPwr32 | 0;
    return new Long(tmp, tmp$ret$1);
  }
}
function greaterThan(_this__u8e3s4, other) {
  _init_properties_longJs_kt__elc2w5();
  return compare(_this__u8e3s4, other) > 0;
}
function greaterThanOrEqual(_this__u8e3s4, other) {
  _init_properties_longJs_kt__elc2w5();
  return compare(_this__u8e3s4, other) >= 0;
}
function getLowBitsUnsigned(_this__u8e3s4) {
  _init_properties_longJs_kt__elc2w5();
  return _this__u8e3s4.k1_1 >= 0 ? _this__u8e3s4.k1_1 : 4.294967296E9 + _this__u8e3s4.k1_1;
}
var properties_initialized_longJs_kt_4syf89;
function _init_properties_longJs_kt__elc2w5() {
  if (!properties_initialized_longJs_kt_4syf89) {
    properties_initialized_longJs_kt_4syf89 = true;
    ZERO = fromInt(0);
    ONE = fromInt(1);
    NEG_ONE = fromInt(-1);
    MAX_VALUE = new Long(-1, 2147483647);
    MIN_VALUE = new Long(0, -2147483648);
    TWO_PWR_24_ = fromInt(16777216);
  }
}
function createMetadata(kind, name, defaultConstructor, associatedObjectKey, associatedObjects, suspendArity) {
  var undef = VOID;
  var iid = kind === 'interface' ? generateInterfaceId() : VOID;
  return {kind: kind, simpleName: name, associatedObjectKey: associatedObjectKey, associatedObjects: associatedObjects, suspendArity: suspendArity, $kClass$: undef, defaultConstructor: defaultConstructor, iid: iid};
}
function generateInterfaceId() {
  if (globalInterfaceId === VOID) {
    globalInterfaceId = 0;
  }
  // Inline function 'kotlin.js.unsafeCast' call
  globalInterfaceId = globalInterfaceId + 1 | 0;
  // Inline function 'kotlin.js.unsafeCast' call
  return globalInterfaceId;
}
var globalInterfaceId;
function initMetadataFor(kind, ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects) {
  if (!(parent == null)) {
    ctor.prototype = Object.create(parent.prototype);
    ctor.prototype.constructor = ctor;
  }
  var metadata = createMetadata(kind, name, defaultConstructor, associatedObjectKey, associatedObjects, suspendArity);
  ctor.$metadata$ = metadata;
  if (!(interfaces == null)) {
    var receiver = !equals(metadata.iid, VOID) ? ctor : ctor.prototype;
    receiver.$imask$ = implement(interfaces);
  }
}
function initMetadataForClass(ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects) {
  var kind = 'class';
  initMetadataFor(kind, ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects);
}
function initMetadataForObject(ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects) {
  var kind = 'object';
  initMetadataFor(kind, ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects);
}
function initMetadataForInterface(ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects) {
  var kind = 'interface';
  initMetadataFor(kind, ctor, name, defaultConstructor, parent, interfaces, suspendArity, associatedObjectKey, associatedObjects);
}
function initMetadataForLambda(ctor, parent, interfaces, suspendArity) {
  initMetadataForClass(ctor, 'Lambda', VOID, parent, interfaces, suspendArity, VOID, VOID);
}
function initMetadataForCoroutine(ctor, parent, interfaces, suspendArity) {
  initMetadataForClass(ctor, 'Coroutine', VOID, parent, interfaces, suspendArity, VOID, VOID);
}
function initMetadataForFunctionReference(ctor, parent, interfaces, suspendArity) {
  initMetadataForClass(ctor, 'FunctionReference', VOID, parent, interfaces, suspendArity, VOID, VOID);
}
function initMetadataForCompanion(ctor, parent, interfaces, suspendArity) {
  initMetadataForObject(ctor, 'Companion', VOID, parent, interfaces, suspendArity, VOID, VOID);
}
function numberToInt(a) {
  var tmp;
  if (a instanceof Long) {
    tmp = a.s1();
  } else {
    tmp = doubleToInt(a);
  }
  return tmp;
}
function doubleToInt(a) {
  var tmp;
  if (a > 2147483647) {
    tmp = 2147483647;
  } else if (a < -2147483648) {
    tmp = -2147483648;
  } else {
    // Inline function 'kotlin.js.jsBitwiseOr' call
    tmp = a | 0;
  }
  return tmp;
}
function toLong(a) {
  return fromInt(a);
}
function numberRangeToNumber(start, endInclusive) {
  return new IntRange(start, endInclusive);
}
function isArrayish(o) {
  return isJsArray(o) || isView(o);
}
function isJsArray(obj) {
  // Inline function 'kotlin.js.unsafeCast' call
  return Array.isArray(obj);
}
function isInterface(obj, iface) {
  return isInterfaceImpl(obj, iface.$metadata$.iid);
}
function isInterfaceImpl(obj, iface) {
  // Inline function 'kotlin.js.unsafeCast' call
  var tmp0_elvis_lhs = obj.$imask$;
  var tmp;
  if (tmp0_elvis_lhs == null) {
    return false;
  } else {
    tmp = tmp0_elvis_lhs;
  }
  var mask = tmp;
  return isBitSet(mask, iface);
}
function isArray(obj) {
  var tmp;
  if (isJsArray(obj)) {
    // Inline function 'kotlin.js.asDynamic' call
    tmp = !obj.$type$;
  } else {
    tmp = false;
  }
  return tmp;
}
function isNumber(a) {
  var tmp;
  if (typeof a === 'number') {
    tmp = true;
  } else {
    tmp = a instanceof Long;
  }
  return tmp;
}
function isComparable(value) {
  var type = typeof value;
  return type === 'string' || type === 'boolean' || isNumber(value) || isInterface(value, Comparable);
}
function isCharSequence(value) {
  return typeof value === 'string' || isInterface(value, CharSequence);
}
function get_VOID() {
  _init_properties_void_kt__3zg9as();
  return VOID;
}
var VOID;
var properties_initialized_void_kt_e4ret2;
function _init_properties_void_kt__3zg9as() {
  if (!properties_initialized_void_kt_e4ret2) {
    properties_initialized_void_kt_e4ret2 = true;
    VOID = void 0;
  }
}
function plus_1(_this__u8e3s4, elements) {
  return arrayPlusCollection(_this__u8e3s4, elements);
}
function asList(_this__u8e3s4) {
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  return new ArrayList(_this__u8e3s4);
}
function sort(_this__u8e3s4) {
  if (_this__u8e3s4.length > 1) {
    sortArray(_this__u8e3s4);
  }
}
function sortWith(_this__u8e3s4, comparator) {
  if (_this__u8e3s4.length > 1) {
    sortArrayWith(_this__u8e3s4, comparator);
  }
}
function fill(_this__u8e3s4, element, fromIndex, toIndex) {
  fromIndex = fromIndex === VOID ? 0 : fromIndex;
  toIndex = toIndex === VOID ? _this__u8e3s4.length : toIndex;
  Companion_instance_3.z1(fromIndex, toIndex, _this__u8e3s4.length);
  // Inline function 'kotlin.js.nativeFill' call
  // Inline function 'kotlin.js.asDynamic' call
  _this__u8e3s4.fill(element, fromIndex, toIndex);
}
function copyOf(_this__u8e3s4, newSize) {
  // Inline function 'kotlin.require' call
  if (!(newSize >= 0)) {
    var message = 'Invalid new array size: ' + newSize + '.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  return fillFrom(_this__u8e3s4, new Int32Array(newSize));
}
function copyOf_0(_this__u8e3s4, newSize) {
  // Inline function 'kotlin.require' call
  if (!(newSize >= 0)) {
    var message = 'Invalid new array size: ' + newSize + '.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  return arrayCopyResize(_this__u8e3s4, newSize, null);
}
function digitToIntImpl(_this__u8e3s4) {
  // Inline function 'kotlin.code' call
  var ch = Char__toInt_impl_vasixd(_this__u8e3s4);
  var index = binarySearchRange(Digit_getInstance().a2_1, ch);
  var diff = ch - Digit_getInstance().a2_1[index] | 0;
  return diff < 10 ? diff : -1;
}
function binarySearchRange(array, needle) {
  var bottom = 0;
  var top = array.length - 1 | 0;
  var middle = -1;
  var value = 0;
  while (bottom <= top) {
    middle = (bottom + top | 0) / 2 | 0;
    value = array[middle];
    if (needle > value)
      bottom = middle + 1 | 0;
    else if (needle === value)
      return middle;
    else
      top = middle - 1 | 0;
  }
  return middle - (needle < value ? 1 : 0) | 0;
}
function Digit() {
  Digit_instance = this;
  var tmp = this;
  // Inline function 'kotlin.intArrayOf' call
  tmp.a2_1 = new Int32Array([48, 1632, 1776, 1984, 2406, 2534, 2662, 2790, 2918, 3046, 3174, 3302, 3430, 3558, 3664, 3792, 3872, 4160, 4240, 6112, 6160, 6470, 6608, 6784, 6800, 6992, 7088, 7232, 7248, 42528, 43216, 43264, 43472, 43504, 43600, 44016, 65296]);
}
var Digit_instance;
function Digit_getInstance() {
  if (Digit_instance == null)
    new Digit();
  return Digit_instance;
}
function Comparator() {
}
function isNaN_0(_this__u8e3s4) {
  return !(_this__u8e3s4 === _this__u8e3s4);
}
function isFinite(_this__u8e3s4) {
  return !isInfinite(_this__u8e3s4) && !isNaN_0(_this__u8e3s4);
}
function isInfinite(_this__u8e3s4) {
  return _this__u8e3s4 === Infinity || _this__u8e3s4 === -Infinity;
}
function takeHighestOneBit(_this__u8e3s4) {
  var tmp;
  if (_this__u8e3s4 === 0) {
    tmp = 0;
  } else {
    // Inline function 'kotlin.countLeadingZeroBits' call
    tmp = 1 << (31 - clz32(_this__u8e3s4) | 0);
  }
  return tmp;
}
function Unit() {
}
protoOf(Unit).toString = function () {
  return 'kotlin.Unit';
};
var Unit_instance;
function Unit_getInstance() {
  return Unit_instance;
}
function collectionToArray(collection) {
  return collectionToArrayCommonImpl(collection);
}
function terminateCollectionToArray(collectionSize, array) {
  return array;
}
function arrayOfNulls(reference, size) {
  // Inline function 'kotlin.arrayOfNulls' call
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  return Array(size);
}
function sort_0(_this__u8e3s4) {
  collectionsSort(_this__u8e3s4, naturalOrder());
}
function listOf(element) {
  // Inline function 'kotlin.arrayOf' call
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var tmp$ret$2 = [element];
  return new ArrayList(tmp$ret$2);
}
function mapCapacity(expectedSize) {
  return expectedSize;
}
function arrayCopy(source, destination, destinationOffset, startIndex, endIndex) {
  Companion_instance_3.z1(startIndex, endIndex, source.length);
  var rangeSize = endIndex - startIndex | 0;
  Companion_instance_3.z1(destinationOffset, destinationOffset + rangeSize | 0, destination.length);
  if (isView(destination) && isView(source)) {
    // Inline function 'kotlin.js.asDynamic' call
    var subrange = source.subarray(startIndex, endIndex);
    // Inline function 'kotlin.js.asDynamic' call
    destination.set(subrange, destinationOffset);
  } else {
    if (!(source === destination) || destinationOffset <= startIndex) {
      var inductionVariable = 0;
      if (inductionVariable < rangeSize)
        do {
          var index = inductionVariable;
          inductionVariable = inductionVariable + 1 | 0;
          destination[destinationOffset + index | 0] = source[startIndex + index | 0];
        }
         while (inductionVariable < rangeSize);
    } else {
      var inductionVariable_0 = rangeSize - 1 | 0;
      if (0 <= inductionVariable_0)
        do {
          var index_0 = inductionVariable_0;
          inductionVariable_0 = inductionVariable_0 + -1 | 0;
          destination[destinationOffset + index_0 | 0] = source[startIndex + index_0 | 0];
        }
         while (0 <= inductionVariable_0);
    }
  }
}
function setOf(element) {
  return hashSetOf([element]);
}
function checkIndexOverflow(index) {
  if (index < 0) {
    throwIndexOverflow();
  }
  return index;
}
function sortWith_0(_this__u8e3s4, comparator) {
  collectionsSort(_this__u8e3s4, comparator);
}
function copyToArray(collection) {
  var tmp;
  // Inline function 'kotlin.js.asDynamic' call
  if (collection.toArray !== undefined) {
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    tmp = collection.toArray();
  } else {
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    tmp = collectionToArray(collection);
  }
  return tmp;
}
function collectionsSort(list, comparator) {
  if (list.o() <= 1)
    return Unit_instance;
  var array = copyToArray(list);
  sortArrayWith(array, comparator);
  var inductionVariable = 0;
  var last = array.length;
  if (inductionVariable < last)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      list.b2(i, array[i]);
    }
     while (inductionVariable < last);
}
function AbstractMutableCollection() {
  AbstractCollection.call(this);
}
protoOf(AbstractMutableCollection).p = function (elements) {
  this.c2();
  var modified = false;
  var _iterator__ex2g4s = elements.j();
  while (_iterator__ex2g4s.k()) {
    var element = _iterator__ex2g4s.l();
    if (this.h(element))
      modified = true;
  }
  return modified;
};
protoOf(AbstractMutableCollection).toJSON = function () {
  return this.toArray();
};
protoOf(AbstractMutableCollection).c2 = function () {
};
function IteratorImpl($outer) {
  this.f2_1 = $outer;
  this.d2_1 = 0;
  this.e2_1 = -1;
}
protoOf(IteratorImpl).k = function () {
  return this.d2_1 < this.f2_1.o();
};
protoOf(IteratorImpl).l = function () {
  if (!this.k())
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.d2_1;
  this.d2_1 = _unary__edvuaz + 1 | 0;
  tmp.e2_1 = _unary__edvuaz;
  return this.f2_1.n(this.e2_1);
};
function ListIteratorImpl($outer, index) {
  this.j2_1 = $outer;
  IteratorImpl.call(this, $outer);
  Companion_instance_3.k2(index, this.j2_1.o());
  this.d2_1 = index;
}
protoOf(ListIteratorImpl).l2 = function () {
  return this.d2_1 > 0;
};
protoOf(ListIteratorImpl).m2 = function () {
  return this.d2_1;
};
protoOf(ListIteratorImpl).n2 = function () {
  if (!this.l2())
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  this.d2_1 = this.d2_1 - 1 | 0;
  tmp.e2_1 = this.d2_1;
  return this.j2_1.n(this.e2_1);
};
function SubList(list, fromIndex, toIndex) {
  AbstractMutableList.call(this);
  this.p2_1 = list;
  this.q2_1 = fromIndex;
  this.r2_1 = 0;
  Companion_instance_3.z1(this.q2_1, toIndex, this.p2_1.o());
  this.r2_1 = toIndex - this.q2_1 | 0;
}
protoOf(SubList).s2 = function (index, element) {
  Companion_instance_3.k2(index, this.r2_1);
  this.p2_1.s2(this.q2_1 + index | 0, element);
  this.r2_1 = this.r2_1 + 1 | 0;
};
protoOf(SubList).n = function (index) {
  Companion_instance_3.u2(index, this.r2_1);
  return this.p2_1.n(this.q2_1 + index | 0);
};
protoOf(SubList).b2 = function (index, element) {
  Companion_instance_3.u2(index, this.r2_1);
  return this.p2_1.b2(this.q2_1 + index | 0, element);
};
protoOf(SubList).o = function () {
  return this.r2_1;
};
protoOf(SubList).c2 = function () {
  return this.p2_1.c2();
};
function AbstractMutableList() {
  AbstractMutableCollection.call(this);
  this.t2_1 = 0;
}
protoOf(AbstractMutableList).h = function (element) {
  this.c2();
  this.s2(this.o(), element);
  return true;
};
protoOf(AbstractMutableList).j = function () {
  return new IteratorImpl(this);
};
protoOf(AbstractMutableList).t = function (element) {
  return this.v(element) >= 0;
};
protoOf(AbstractMutableList).v = function (element) {
  var tmp$ret$1;
  $l$block: {
    // Inline function 'kotlin.collections.indexOfFirst' call
    var index = 0;
    var _iterator__ex2g4s = this.j();
    while (_iterator__ex2g4s.k()) {
      var item = _iterator__ex2g4s.l();
      if (equals(item, element)) {
        tmp$ret$1 = index;
        break $l$block;
      }
      index = index + 1 | 0;
    }
    tmp$ret$1 = -1;
  }
  return tmp$ret$1;
};
protoOf(AbstractMutableList).w = function (element) {
  var tmp$ret$1;
  $l$block: {
    // Inline function 'kotlin.collections.indexOfLast' call
    var iterator = this.y(this.o());
    while (iterator.l2()) {
      var it = iterator.n2();
      if (equals(it, element)) {
        tmp$ret$1 = iterator.m2();
        break $l$block;
      }
    }
    tmp$ret$1 = -1;
  }
  return tmp$ret$1;
};
protoOf(AbstractMutableList).x = function () {
  return this.y(0);
};
protoOf(AbstractMutableList).y = function (index) {
  return new ListIteratorImpl(this, index);
};
protoOf(AbstractMutableList).z = function (fromIndex, toIndex) {
  return new SubList(this, fromIndex, toIndex);
};
protoOf(AbstractMutableList).equals = function (other) {
  if (other === this)
    return true;
  if (!(!(other == null) ? isInterface(other, KtList_0) : false))
    return false;
  return Companion_instance_3.v2(this, other);
};
protoOf(AbstractMutableList).hashCode = function () {
  return Companion_instance_3.w2(this);
};
function AbstractMutableMap() {
  AbstractMap.call(this);
  this.z2_1 = null;
  this.a3_1 = null;
}
protoOf(AbstractMutableMap).b3 = function () {
  return new HashMapKeysDefault(this);
};
protoOf(AbstractMutableMap).e1 = function () {
  var tmp0_elvis_lhs = this.z2_1;
  var tmp;
  if (tmp0_elvis_lhs == null) {
    // Inline function 'kotlin.also' call
    var this_0 = this.b3();
    this.z2_1 = this_0;
    tmp = this_0;
  } else {
    tmp = tmp0_elvis_lhs;
  }
  return tmp;
};
protoOf(AbstractMutableMap).c2 = function () {
};
function AbstractMutableSet() {
  AbstractMutableCollection.call(this);
}
protoOf(AbstractMutableSet).equals = function (other) {
  if (other === this)
    return true;
  if (!(!(other == null) ? isInterface(other, KtSet) : false))
    return false;
  return Companion_instance_5.g3(this, other);
};
protoOf(AbstractMutableSet).hashCode = function () {
  return Companion_instance_5.h3(this);
};
function arrayOfUninitializedElements(capacity) {
  // Inline function 'kotlin.require' call
  if (!(capacity >= 0)) {
    var message = 'capacity must be non-negative.';
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  // Inline function 'kotlin.arrayOfNulls' call
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  return Array(capacity);
}
function resetRange(_this__u8e3s4, fromIndex, toIndex) {
  // Inline function 'kotlin.js.nativeFill' call
  // Inline function 'kotlin.js.asDynamic' call
  _this__u8e3s4.fill(null, fromIndex, toIndex);
}
function copyOfUninitializedElements(_this__u8e3s4, newSize) {
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  return copyOf_0(_this__u8e3s4, newSize);
}
function Companion_1() {
  Companion_instance_1 = this;
  var tmp = this;
  // Inline function 'kotlin.also' call
  var this_0 = ArrayList_init_$Create$_0(0);
  this_0.g_1 = true;
  tmp.i3_1 = this_0;
}
var Companion_instance_1;
function Companion_getInstance_1() {
  if (Companion_instance_1 == null)
    new Companion_1();
  return Companion_instance_1;
}
function ArrayList_init_$Init$($this) {
  // Inline function 'kotlin.emptyArray' call
  var tmp$ret$0 = [];
  ArrayList.call($this, tmp$ret$0);
  return $this;
}
function ArrayList_init_$Create$() {
  return ArrayList_init_$Init$(objectCreate(protoOf(ArrayList)));
}
function ArrayList_init_$Init$_0(initialCapacity, $this) {
  // Inline function 'kotlin.emptyArray' call
  var tmp$ret$0 = [];
  ArrayList.call($this, tmp$ret$0);
  // Inline function 'kotlin.require' call
  if (!(initialCapacity >= 0)) {
    var message = 'Negative initial capacity: ' + initialCapacity;
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  return $this;
}
function ArrayList_init_$Create$_0(initialCapacity) {
  return ArrayList_init_$Init$_0(initialCapacity, objectCreate(protoOf(ArrayList)));
}
function ArrayList_init_$Init$_1(elements, $this) {
  // Inline function 'kotlin.collections.toTypedArray' call
  var tmp$ret$0 = copyToArray(elements);
  ArrayList.call($this, tmp$ret$0);
  return $this;
}
function ArrayList_init_$Create$_1(elements) {
  return ArrayList_init_$Init$_1(elements, objectCreate(protoOf(ArrayList)));
}
function increaseLength($this, amount) {
  var previous = $this.o();
  // Inline function 'kotlin.js.asDynamic' call
  $this.f_1.length = $this.o() + amount | 0;
  return previous;
}
function rangeCheck($this, index) {
  // Inline function 'kotlin.apply' call
  Companion_instance_3.u2(index, $this.o());
  return index;
}
function insertionRangeCheck($this, index) {
  // Inline function 'kotlin.apply' call
  Companion_instance_3.k2(index, $this.o());
  return index;
}
function ArrayList(array) {
  Companion_getInstance_1();
  AbstractMutableList.call(this);
  this.f_1 = array;
  this.g_1 = false;
}
protoOf(ArrayList).x1 = function () {
  this.c2();
  this.g_1 = true;
  return this.o() > 0 ? this : Companion_getInstance_1().i3_1;
};
protoOf(ArrayList).o = function () {
  return this.f_1.length;
};
protoOf(ArrayList).n = function (index) {
  var tmp = this.f_1[rangeCheck(this, index)];
  return (tmp == null ? true : !(tmp == null)) ? tmp : THROW_CCE();
};
protoOf(ArrayList).b2 = function (index, element) {
  this.c2();
  rangeCheck(this, index);
  // Inline function 'kotlin.apply' call
  var this_0 = this.f_1[index];
  this.f_1[index] = element;
  var tmp = this_0;
  return (tmp == null ? true : !(tmp == null)) ? tmp : THROW_CCE();
};
protoOf(ArrayList).h = function (element) {
  this.c2();
  // Inline function 'kotlin.js.asDynamic' call
  this.f_1.push(element);
  this.t2_1 = this.t2_1 + 1 | 0;
  return true;
};
protoOf(ArrayList).s2 = function (index, element) {
  this.c2();
  // Inline function 'kotlin.js.asDynamic' call
  this.f_1.splice(insertionRangeCheck(this, index), 0, element);
  this.t2_1 = this.t2_1 + 1 | 0;
};
protoOf(ArrayList).p = function (elements) {
  this.c2();
  if (elements.m())
    return false;
  var offset = increaseLength(this, elements.o());
  // Inline function 'kotlin.collections.forEachIndexed' call
  var index = 0;
  var _iterator__ex2g4s = elements.j();
  while (_iterator__ex2g4s.k()) {
    var item = _iterator__ex2g4s.l();
    var _unary__edvuaz = index;
    index = _unary__edvuaz + 1 | 0;
    var index_0 = checkIndexOverflow(_unary__edvuaz);
    this.f_1[offset + index_0 | 0] = item;
  }
  this.t2_1 = this.t2_1 + 1 | 0;
  return true;
};
protoOf(ArrayList).j3 = function (index) {
  this.c2();
  rangeCheck(this, index);
  this.t2_1 = this.t2_1 + 1 | 0;
  var tmp;
  if (index === get_lastIndex_0(this)) {
    // Inline function 'kotlin.js.asDynamic' call
    tmp = this.f_1.pop();
  } else {
    // Inline function 'kotlin.js.asDynamic' call
    tmp = this.f_1.splice(index, 1)[0];
  }
  return tmp;
};
protoOf(ArrayList).k3 = function () {
  this.c2();
  var tmp = this;
  // Inline function 'kotlin.emptyArray' call
  tmp.f_1 = [];
  this.t2_1 = this.t2_1 + 1 | 0;
};
protoOf(ArrayList).v = function (element) {
  return indexOf(this.f_1, element);
};
protoOf(ArrayList).w = function (element) {
  return lastIndexOf(this.f_1, element);
};
protoOf(ArrayList).toString = function () {
  return arrayToString(this.f_1);
};
protoOf(ArrayList).l3 = function () {
  return [].slice.call(this.f_1);
};
protoOf(ArrayList).toArray = function () {
  return this.l3();
};
protoOf(ArrayList).c2 = function () {
  if (this.g_1)
    throw UnsupportedOperationException_init_$Create$();
};
var _stableSortingIsSupported;
function sortArray(array) {
  if (getStableSortingIsSupported()) {
    var comparison = sortArray$lambda;
    // Inline function 'kotlin.js.asDynamic' call
    array.sort(comparison);
  } else {
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    mergeSort(array, 0, get_lastIndex(array), naturalOrder());
  }
}
function sortArrayWith(array, comparator) {
  if (getStableSortingIsSupported()) {
    var comparison = sortArrayWith$lambda(comparator);
    // Inline function 'kotlin.js.asDynamic' call
    array.sort(comparison);
  } else {
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    mergeSort(array, 0, get_lastIndex(array), comparator);
  }
}
function getStableSortingIsSupported() {
  var tmp0_safe_receiver = _stableSortingIsSupported;
  if (tmp0_safe_receiver == null)
    null;
  else {
    // Inline function 'kotlin.let' call
    return tmp0_safe_receiver;
  }
  _stableSortingIsSupported = false;
  // Inline function 'kotlin.js.unsafeCast' call
  var array = [];
  var inductionVariable = 0;
  if (inductionVariable < 600)
    do {
      var index = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      // Inline function 'kotlin.js.asDynamic' call
      array.push(index);
    }
     while (inductionVariable < 600);
  var comparison = getStableSortingIsSupported$lambda;
  // Inline function 'kotlin.js.asDynamic' call
  array.sort(comparison);
  var inductionVariable_0 = 1;
  var last = array.length;
  if (inductionVariable_0 < last)
    do {
      var index_0 = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      var a = array[index_0 - 1 | 0];
      var b = array[index_0];
      if ((a & 3) === (b & 3) && a >= b)
        return false;
    }
     while (inductionVariable_0 < last);
  _stableSortingIsSupported = true;
  return true;
}
function mergeSort(array, start, endInclusive, comparator) {
  // Inline function 'kotlin.arrayOfNulls' call
  var size = array.length;
  // Inline function 'kotlin.js.unsafeCast' call
  // Inline function 'kotlin.js.asDynamic' call
  var buffer = Array(size);
  var result = mergeSort_0(array, buffer, start, endInclusive, comparator);
  if (!(result === array)) {
    var inductionVariable = start;
    if (inductionVariable <= endInclusive)
      do {
        var i = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        array[i] = result[i];
      }
       while (!(i === endInclusive));
  }
}
function mergeSort_0(array, buffer, start, end, comparator) {
  if (start === end) {
    return array;
  }
  var median = (start + end | 0) / 2 | 0;
  var left = mergeSort_0(array, buffer, start, median, comparator);
  var right = mergeSort_0(array, buffer, median + 1 | 0, end, comparator);
  var target = left === buffer ? array : buffer;
  var leftIndex = start;
  var rightIndex = median + 1 | 0;
  var inductionVariable = start;
  if (inductionVariable <= end)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      if (leftIndex <= median && rightIndex <= end) {
        var leftValue = left[leftIndex];
        var rightValue = right[rightIndex];
        if (comparator.compare(leftValue, rightValue) <= 0) {
          target[i] = leftValue;
          leftIndex = leftIndex + 1 | 0;
        } else {
          target[i] = rightValue;
          rightIndex = rightIndex + 1 | 0;
        }
      } else if (leftIndex <= median) {
        target[i] = left[leftIndex];
        leftIndex = leftIndex + 1 | 0;
      } else {
        target[i] = right[rightIndex];
        rightIndex = rightIndex + 1 | 0;
      }
    }
     while (!(i === end));
  return target;
}
function sortArray$lambda(a, b) {
  return compareTo(a, b);
}
function sortArrayWith$lambda($comparator) {
  return function (a, b) {
    return $comparator.compare(a, b);
  };
}
function getStableSortingIsSupported$lambda(a, b) {
  return (a & 3) - (b & 3) | 0;
}
function HashMap_init_$Init$(internalMap, $this) {
  AbstractMutableMap.call($this);
  HashMap.call($this);
  $this.q3_1 = internalMap;
  return $this;
}
function HashMap_init_$Init$_0($this) {
  HashMap_init_$Init$(InternalHashMap_init_$Create$(), $this);
  return $this;
}
function HashMap_init_$Create$() {
  return HashMap_init_$Init$_0(objectCreate(protoOf(HashMap)));
}
function HashMap_init_$Init$_1(initialCapacity, loadFactor, $this) {
  HashMap_init_$Init$(InternalHashMap_init_$Create$_1(initialCapacity, loadFactor), $this);
  return $this;
}
function HashMap_init_$Init$_2(initialCapacity, $this) {
  HashMap_init_$Init$_1(initialCapacity, 1.0, $this);
  return $this;
}
protoOf(HashMap).c1 = function (key) {
  return this.q3_1.s3(key);
};
protoOf(HashMap).b3 = function () {
  return new HashMapKeys(this.q3_1);
};
protoOf(HashMap).f1 = function () {
  var tmp0_elvis_lhs = this.r3_1;
  var tmp;
  if (tmp0_elvis_lhs == null) {
    // Inline function 'kotlin.also' call
    var this_0 = new HashMapEntrySet(this.q3_1);
    this.r3_1 = this_0;
    tmp = this_0;
  } else {
    tmp = tmp0_elvis_lhs;
  }
  return tmp;
};
protoOf(HashMap).d1 = function (key) {
  return this.q3_1.d1(key);
};
protoOf(HashMap).c3 = function (key, value) {
  return this.q3_1.c3(key, value);
};
protoOf(HashMap).o = function () {
  return this.q3_1.o();
};
function HashMap() {
  this.r3_1 = null;
}
function HashMapKeys(backing) {
  AbstractMutableSet.call(this);
  this.t3_1 = backing;
}
protoOf(HashMapKeys).o = function () {
  return this.t3_1.o();
};
protoOf(HashMapKeys).m = function () {
  return this.t3_1.o() === 0;
};
protoOf(HashMapKeys).t = function (element) {
  return this.t3_1.s3(element);
};
protoOf(HashMapKeys).h = function (element) {
  throw UnsupportedOperationException_init_$Create$();
};
protoOf(HashMapKeys).p = function (elements) {
  throw UnsupportedOperationException_init_$Create$();
};
protoOf(HashMapKeys).j = function () {
  return this.t3_1.u3();
};
protoOf(HashMapKeys).c2 = function () {
  return this.t3_1.v3();
};
function HashMapEntrySet(backing) {
  HashMapEntrySetBase.call(this, backing);
}
protoOf(HashMapEntrySet).j = function () {
  return this.x3_1.y3();
};
function HashMapEntrySetBase(backing) {
  AbstractMutableSet.call(this);
  this.x3_1 = backing;
}
protoOf(HashMapEntrySetBase).o = function () {
  return this.x3_1.o();
};
protoOf(HashMapEntrySetBase).m = function () {
  return this.x3_1.o() === 0;
};
protoOf(HashMapEntrySetBase).z3 = function (element) {
  return this.x3_1.b4(element);
};
protoOf(HashMapEntrySetBase).t = function (element) {
  if (!(!(element == null) ? isInterface(element, Entry) : false))
    return false;
  return this.z3((!(element == null) ? isInterface(element, Entry) : false) ? element : THROW_CCE());
};
protoOf(HashMapEntrySetBase).a4 = function (element) {
  throw UnsupportedOperationException_init_$Create$();
};
protoOf(HashMapEntrySetBase).h = function (element) {
  return this.a4((!(element == null) ? isInterface(element, Entry) : false) ? element : THROW_CCE());
};
protoOf(HashMapEntrySetBase).p = function (elements) {
  throw UnsupportedOperationException_init_$Create$();
};
protoOf(HashMapEntrySetBase).u = function (elements) {
  return this.x3_1.c4(elements);
};
protoOf(HashMapEntrySetBase).c2 = function () {
  return this.x3_1.v3();
};
function HashMapKeysDefault$iterator$1($entryIterator) {
  this.d4_1 = $entryIterator;
}
protoOf(HashMapKeysDefault$iterator$1).k = function () {
  return this.d4_1.k();
};
protoOf(HashMapKeysDefault$iterator$1).l = function () {
  return this.d4_1.l().a1();
};
function HashMapKeysDefault(backingMap) {
  AbstractMutableSet.call(this);
  this.e4_1 = backingMap;
}
protoOf(HashMapKeysDefault).f4 = function (element) {
  throw UnsupportedOperationException_init_$Create$_0('Add is not supported on keys');
};
protoOf(HashMapKeysDefault).h = function (element) {
  return this.f4((element == null ? true : !(element == null)) ? element : THROW_CCE());
};
protoOf(HashMapKeysDefault).s3 = function (element) {
  return this.e4_1.c1(element);
};
protoOf(HashMapKeysDefault).t = function (element) {
  if (!(element == null ? true : !(element == null)))
    return false;
  return this.s3((element == null ? true : !(element == null)) ? element : THROW_CCE());
};
protoOf(HashMapKeysDefault).j = function () {
  var entryIterator = this.e4_1.f1().j();
  return new HashMapKeysDefault$iterator$1(entryIterator);
};
protoOf(HashMapKeysDefault).o = function () {
  return this.e4_1.o();
};
protoOf(HashMapKeysDefault).c2 = function () {
  return this.e4_1.c2();
};
function HashSet_init_$Init$(map, $this) {
  AbstractMutableSet.call($this);
  HashSet.call($this);
  $this.g4_1 = map;
  return $this;
}
function HashSet_init_$Init$_0($this) {
  HashSet_init_$Init$(InternalHashMap_init_$Create$(), $this);
  return $this;
}
function HashSet_init_$Create$() {
  return HashSet_init_$Init$_0(objectCreate(protoOf(HashSet)));
}
function HashSet_init_$Init$_1(elements, $this) {
  HashSet_init_$Init$(InternalHashMap_init_$Create$_0(elements.o()), $this);
  var _iterator__ex2g4s = elements.j();
  while (_iterator__ex2g4s.k()) {
    var element = _iterator__ex2g4s.l();
    $this.g4_1.c3(element, true);
  }
  return $this;
}
function HashSet_init_$Init$_2(initialCapacity, loadFactor, $this) {
  HashSet_init_$Init$(InternalHashMap_init_$Create$_1(initialCapacity, loadFactor), $this);
  return $this;
}
function HashSet_init_$Init$_3(initialCapacity, $this) {
  HashSet_init_$Init$_2(initialCapacity, 1.0, $this);
  return $this;
}
function HashSet_init_$Create$_0(initialCapacity) {
  return HashSet_init_$Init$_3(initialCapacity, objectCreate(protoOf(HashSet)));
}
protoOf(HashSet).h = function (element) {
  return this.g4_1.c3(element, true) == null;
};
protoOf(HashSet).t = function (element) {
  return this.g4_1.s3(element);
};
protoOf(HashSet).m = function () {
  return this.g4_1.o() === 0;
};
protoOf(HashSet).j = function () {
  return this.g4_1.u3();
};
protoOf(HashSet).o = function () {
  return this.g4_1.o();
};
function HashSet() {
}
function computeHashSize($this, capacity) {
  return takeHighestOneBit(imul_0(coerceAtLeast(capacity, 1), 3));
}
function computeShift($this, hashSize) {
  // Inline function 'kotlin.countLeadingZeroBits' call
  return clz32(hashSize) + 1 | 0;
}
function checkForComodification($this) {
  if (!($this.r4_1.o4_1 === $this.t4_1))
    throw ConcurrentModificationException_init_$Create$_0('The backing map has been modified after this entry was obtained.');
}
function InternalHashMap_init_$Init$($this) {
  InternalHashMap_init_$Init$_0(8, $this);
  return $this;
}
function InternalHashMap_init_$Create$() {
  return InternalHashMap_init_$Init$(objectCreate(protoOf(InternalHashMap)));
}
function InternalHashMap_init_$Init$_0(initialCapacity, $this) {
  InternalHashMap.call($this, arrayOfUninitializedElements(initialCapacity), null, new Int32Array(initialCapacity), new Int32Array(computeHashSize(Companion_instance_2, initialCapacity)), 2, 0);
  return $this;
}
function InternalHashMap_init_$Create$_0(initialCapacity) {
  return InternalHashMap_init_$Init$_0(initialCapacity, objectCreate(protoOf(InternalHashMap)));
}
function InternalHashMap_init_$Init$_1(initialCapacity, loadFactor, $this) {
  InternalHashMap_init_$Init$_0(initialCapacity, $this);
  // Inline function 'kotlin.require' call
  if (!(loadFactor > 0)) {
    var message = 'Non-positive load factor: ' + loadFactor;
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  return $this;
}
function InternalHashMap_init_$Create$_1(initialCapacity, loadFactor) {
  return InternalHashMap_init_$Init$_1(initialCapacity, loadFactor, objectCreate(protoOf(InternalHashMap)));
}
function _get_capacity__a9k9f3($this) {
  return $this.h4_1.length;
}
function _get_hashSize__tftcho($this) {
  return $this.k4_1.length;
}
function registerModification($this) {
  $this.o4_1 = $this.o4_1 + 1 | 0;
}
function ensureExtraCapacity($this, n) {
  if (shouldCompact($this, n)) {
    compact($this, true);
  } else {
    ensureCapacity($this, $this.m4_1 + n | 0);
  }
}
function shouldCompact($this, extraCapacity) {
  var spareCapacity = _get_capacity__a9k9f3($this) - $this.m4_1 | 0;
  var gaps = $this.m4_1 - $this.o() | 0;
  return spareCapacity < extraCapacity && (gaps + spareCapacity | 0) >= extraCapacity && gaps >= (_get_capacity__a9k9f3($this) / 4 | 0);
}
function ensureCapacity($this, minCapacity) {
  if (minCapacity < 0)
    throw RuntimeException_init_$Create$_0('too many elements');
  if (minCapacity > _get_capacity__a9k9f3($this)) {
    var newSize = Companion_instance_3.u4(_get_capacity__a9k9f3($this), minCapacity);
    $this.h4_1 = copyOfUninitializedElements($this.h4_1, newSize);
    var tmp = $this;
    var tmp0_safe_receiver = $this.i4_1;
    tmp.i4_1 = tmp0_safe_receiver == null ? null : copyOfUninitializedElements(tmp0_safe_receiver, newSize);
    $this.j4_1 = copyOf($this.j4_1, newSize);
    var newHashSize = computeHashSize(Companion_instance_2, newSize);
    if (newHashSize > _get_hashSize__tftcho($this)) {
      rehash($this, newHashSize);
    }
  }
}
function allocateValuesArray($this) {
  var curValuesArray = $this.i4_1;
  if (!(curValuesArray == null))
    return curValuesArray;
  var newValuesArray = arrayOfUninitializedElements(_get_capacity__a9k9f3($this));
  $this.i4_1 = newValuesArray;
  return newValuesArray;
}
function hash($this, key) {
  return key == null ? 0 : imul_0(hashCode(key), -1640531527) >>> $this.n4_1 | 0;
}
function compact($this, updateHashArray) {
  var i = 0;
  var j = 0;
  var valuesArray = $this.i4_1;
  while (i < $this.m4_1) {
    var hash = $this.j4_1[i];
    if (hash >= 0) {
      $this.h4_1[j] = $this.h4_1[i];
      if (!(valuesArray == null)) {
        valuesArray[j] = valuesArray[i];
      }
      if (updateHashArray) {
        $this.j4_1[j] = hash;
        $this.k4_1[hash] = j + 1 | 0;
      }
      j = j + 1 | 0;
    }
    i = i + 1 | 0;
  }
  resetRange($this.h4_1, j, $this.m4_1);
  if (valuesArray == null)
    null;
  else {
    resetRange(valuesArray, j, $this.m4_1);
  }
  $this.m4_1 = j;
}
function rehash($this, newHashSize) {
  registerModification($this);
  if ($this.m4_1 > $this.p4_1) {
    compact($this, false);
  }
  $this.k4_1 = new Int32Array(newHashSize);
  $this.n4_1 = computeShift(Companion_instance_2, newHashSize);
  var i = 0;
  while (i < $this.m4_1) {
    var _unary__edvuaz = i;
    i = _unary__edvuaz + 1 | 0;
    if (!putRehash($this, _unary__edvuaz)) {
      throw IllegalStateException_init_$Create$_0('This cannot happen with fixed magic multiplier and grow-only hash array. Have object hashCodes changed?');
    }
  }
}
function putRehash($this, i) {
  var hash_0 = hash($this, $this.h4_1[i]);
  var probesLeft = $this.l4_1;
  while (true) {
    var index = $this.k4_1[hash_0];
    if (index === 0) {
      $this.k4_1[hash_0] = i + 1 | 0;
      $this.j4_1[i] = hash_0;
      return true;
    }
    probesLeft = probesLeft - 1 | 0;
    if (probesLeft < 0)
      return false;
    var _unary__edvuaz = hash_0;
    hash_0 = _unary__edvuaz - 1 | 0;
    if (_unary__edvuaz === 0)
      hash_0 = _get_hashSize__tftcho($this) - 1 | 0;
  }
}
function findKey($this, key) {
  var hash_0 = hash($this, key);
  var probesLeft = $this.l4_1;
  while (true) {
    var index = $this.k4_1[hash_0];
    if (index === 0)
      return -1;
    if (index > 0 && equals($this.h4_1[index - 1 | 0], key))
      return index - 1 | 0;
    probesLeft = probesLeft - 1 | 0;
    if (probesLeft < 0)
      return -1;
    var _unary__edvuaz = hash_0;
    hash_0 = _unary__edvuaz - 1 | 0;
    if (_unary__edvuaz === 0)
      hash_0 = _get_hashSize__tftcho($this) - 1 | 0;
  }
}
function addKey($this, key) {
  $this.v3();
  retry: while (true) {
    var hash_0 = hash($this, key);
    var tentativeMaxProbeDistance = coerceAtMost(imul_0($this.l4_1, 2), _get_hashSize__tftcho($this) / 2 | 0);
    var probeDistance = 0;
    while (true) {
      var index = $this.k4_1[hash_0];
      if (index <= 0) {
        if ($this.m4_1 >= _get_capacity__a9k9f3($this)) {
          ensureExtraCapacity($this, 1);
          continue retry;
        }
        var _unary__edvuaz = $this.m4_1;
        $this.m4_1 = _unary__edvuaz + 1 | 0;
        var putIndex = _unary__edvuaz;
        $this.h4_1[putIndex] = key;
        $this.j4_1[putIndex] = hash_0;
        $this.k4_1[hash_0] = putIndex + 1 | 0;
        $this.p4_1 = $this.p4_1 + 1 | 0;
        registerModification($this);
        if (probeDistance > $this.l4_1)
          $this.l4_1 = probeDistance;
        return putIndex;
      }
      if (equals($this.h4_1[index - 1 | 0], key)) {
        return -index | 0;
      }
      probeDistance = probeDistance + 1 | 0;
      if (probeDistance > tentativeMaxProbeDistance) {
        rehash($this, imul_0(_get_hashSize__tftcho($this), 2));
        continue retry;
      }
      var _unary__edvuaz_0 = hash_0;
      hash_0 = _unary__edvuaz_0 - 1 | 0;
      if (_unary__edvuaz_0 === 0)
        hash_0 = _get_hashSize__tftcho($this) - 1 | 0;
    }
  }
}
function contentEquals($this, other) {
  return $this.p4_1 === other.o() && $this.c4(other.f1());
}
function Companion_2() {
  this.v4_1 = -1640531527;
  this.w4_1 = 8;
  this.x4_1 = 2;
  this.y4_1 = -1;
}
var Companion_instance_2;
function Companion_getInstance_2() {
  return Companion_instance_2;
}
function Itr(map) {
  this.z4_1 = map;
  this.a5_1 = 0;
  this.b5_1 = -1;
  this.c5_1 = this.z4_1.o4_1;
  this.d5();
}
protoOf(Itr).d5 = function () {
  while (this.a5_1 < this.z4_1.m4_1 && this.z4_1.j4_1[this.a5_1] < 0) {
    this.a5_1 = this.a5_1 + 1 | 0;
  }
};
protoOf(Itr).k = function () {
  return this.a5_1 < this.z4_1.m4_1;
};
protoOf(Itr).e5 = function () {
  if (!(this.z4_1.o4_1 === this.c5_1))
    throw ConcurrentModificationException_init_$Create$();
};
function KeysItr(map) {
  Itr.call(this, map);
}
protoOf(KeysItr).l = function () {
  this.e5();
  if (this.a5_1 >= this.z4_1.m4_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.a5_1;
  this.a5_1 = _unary__edvuaz + 1 | 0;
  tmp.b5_1 = _unary__edvuaz;
  var result = this.z4_1.h4_1[this.b5_1];
  this.d5();
  return result;
};
function EntriesItr(map) {
  Itr.call(this, map);
}
protoOf(EntriesItr).l = function () {
  this.e5();
  if (this.a5_1 >= this.z4_1.m4_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.a5_1;
  this.a5_1 = _unary__edvuaz + 1 | 0;
  tmp.b5_1 = _unary__edvuaz;
  var result = new EntryRef(this.z4_1, this.b5_1);
  this.d5();
  return result;
};
protoOf(EntriesItr).n5 = function () {
  if (this.a5_1 >= this.z4_1.m4_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.a5_1;
  this.a5_1 = _unary__edvuaz + 1 | 0;
  tmp.b5_1 = _unary__edvuaz;
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver = this.z4_1.h4_1[this.b5_1];
  var tmp1_elvis_lhs = tmp0_safe_receiver == null ? null : hashCode(tmp0_safe_receiver);
  var tmp_0 = tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs;
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver_0 = ensureNotNull(this.z4_1.i4_1)[this.b5_1];
  var tmp1_elvis_lhs_0 = tmp0_safe_receiver_0 == null ? null : hashCode(tmp0_safe_receiver_0);
  var result = tmp_0 ^ (tmp1_elvis_lhs_0 == null ? 0 : tmp1_elvis_lhs_0);
  this.d5();
  return result;
};
protoOf(EntriesItr).o5 = function (sb) {
  if (this.a5_1 >= this.z4_1.m4_1)
    throw NoSuchElementException_init_$Create$();
  var tmp = this;
  var _unary__edvuaz = this.a5_1;
  this.a5_1 = _unary__edvuaz + 1 | 0;
  tmp.b5_1 = _unary__edvuaz;
  var key = this.z4_1.h4_1[this.b5_1];
  if (equals(key, this.z4_1))
    sb.r5('(this Map)');
  else
    sb.q5(key);
  sb.s5(_Char___init__impl__6a9atx(61));
  var value = ensureNotNull(this.z4_1.i4_1)[this.b5_1];
  if (equals(value, this.z4_1))
    sb.r5('(this Map)');
  else
    sb.q5(value);
  this.d5();
};
function EntryRef(map, index) {
  this.r4_1 = map;
  this.s4_1 = index;
  this.t4_1 = this.r4_1.o4_1;
}
protoOf(EntryRef).a1 = function () {
  checkForComodification(this);
  return this.r4_1.h4_1[this.s4_1];
};
protoOf(EntryRef).b1 = function () {
  checkForComodification(this);
  return ensureNotNull(this.r4_1.i4_1)[this.s4_1];
};
protoOf(EntryRef).equals = function (other) {
  var tmp;
  var tmp_0;
  if (!(other == null) ? isInterface(other, Entry) : false) {
    tmp_0 = equals(other.a1(), this.a1());
  } else {
    tmp_0 = false;
  }
  if (tmp_0) {
    tmp = equals(other.b1(), this.b1());
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(EntryRef).hashCode = function () {
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver = this.a1();
  var tmp1_elvis_lhs = tmp0_safe_receiver == null ? null : hashCode(tmp0_safe_receiver);
  var tmp = tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs;
  // Inline function 'kotlin.hashCode' call
  var tmp0_safe_receiver_0 = this.b1();
  var tmp1_elvis_lhs_0 = tmp0_safe_receiver_0 == null ? null : hashCode(tmp0_safe_receiver_0);
  return tmp ^ (tmp1_elvis_lhs_0 == null ? 0 : tmp1_elvis_lhs_0);
};
protoOf(EntryRef).toString = function () {
  return toString_0(this.a1()) + '=' + toString_0(this.b1());
};
function InternalHashMap(keysArray, valuesArray, presenceArray, hashArray, maxProbeDistance, length) {
  this.h4_1 = keysArray;
  this.i4_1 = valuesArray;
  this.j4_1 = presenceArray;
  this.k4_1 = hashArray;
  this.l4_1 = maxProbeDistance;
  this.m4_1 = length;
  this.n4_1 = computeShift(Companion_instance_2, _get_hashSize__tftcho(this));
  this.o4_1 = 0;
  this.p4_1 = 0;
  this.q4_1 = false;
}
protoOf(InternalHashMap).o = function () {
  return this.p4_1;
};
protoOf(InternalHashMap).d1 = function (key) {
  var index = findKey(this, key);
  if (index < 0)
    return null;
  return ensureNotNull(this.i4_1)[index];
};
protoOf(InternalHashMap).s3 = function (key) {
  return findKey(this, key) >= 0;
};
protoOf(InternalHashMap).c3 = function (key, value) {
  var index = addKey(this, key);
  var valuesArray = allocateValuesArray(this);
  if (index < 0) {
    var oldValue = valuesArray[(-index | 0) - 1 | 0];
    valuesArray[(-index | 0) - 1 | 0] = value;
    return oldValue;
  } else {
    valuesArray[index] = value;
    return null;
  }
};
protoOf(InternalHashMap).equals = function (other) {
  var tmp;
  if (other === this) {
    tmp = true;
  } else {
    var tmp_0;
    if (!(other == null) ? isInterface(other, KtMap) : false) {
      tmp_0 = contentEquals(this, other);
    } else {
      tmp_0 = false;
    }
    tmp = tmp_0;
  }
  return tmp;
};
protoOf(InternalHashMap).hashCode = function () {
  var result = 0;
  var it = this.y3();
  while (it.k()) {
    result = result + it.n5() | 0;
  }
  return result;
};
protoOf(InternalHashMap).toString = function () {
  var sb = StringBuilder_init_$Create$(2 + imul_0(this.p4_1, 3) | 0);
  sb.r5('{');
  var i = 0;
  var it = this.y3();
  while (it.k()) {
    if (i > 0) {
      sb.r5(', ');
    }
    it.o5(sb);
    i = i + 1 | 0;
  }
  sb.r5('}');
  return sb.toString();
};
protoOf(InternalHashMap).v3 = function () {
  if (this.q4_1)
    throw UnsupportedOperationException_init_$Create$();
};
protoOf(InternalHashMap).b4 = function (entry) {
  var index = findKey(this, entry.a1());
  if (index < 0)
    return false;
  return equals(ensureNotNull(this.i4_1)[index], entry.b1());
};
protoOf(InternalHashMap).t5 = function (entry) {
  return this.b4(isInterface(entry, Entry) ? entry : THROW_CCE());
};
protoOf(InternalHashMap).u3 = function () {
  return new KeysItr(this);
};
protoOf(InternalHashMap).y3 = function () {
  return new EntriesItr(this);
};
function InternalMap() {
}
function LinkedHashMap_init_$Init$($this) {
  HashMap_init_$Init$_0($this);
  LinkedHashMap.call($this);
  return $this;
}
function LinkedHashMap_init_$Create$() {
  return LinkedHashMap_init_$Init$(objectCreate(protoOf(LinkedHashMap)));
}
function LinkedHashMap_init_$Init$_0(initialCapacity, $this) {
  HashMap_init_$Init$_2(initialCapacity, $this);
  LinkedHashMap.call($this);
  return $this;
}
function LinkedHashMap_init_$Create$_0(initialCapacity) {
  return LinkedHashMap_init_$Init$_0(initialCapacity, objectCreate(protoOf(LinkedHashMap)));
}
protoOf(LinkedHashMap).c2 = function () {
  return this.q3_1.v3();
};
function LinkedHashMap() {
}
function LinkedHashSet_init_$Init$($this) {
  HashSet_init_$Init$_0($this);
  LinkedHashSet.call($this);
  return $this;
}
function LinkedHashSet_init_$Create$() {
  return LinkedHashSet_init_$Init$(objectCreate(protoOf(LinkedHashSet)));
}
function LinkedHashSet_init_$Init$_0(elements, $this) {
  HashSet_init_$Init$_1(elements, $this);
  LinkedHashSet.call($this);
  return $this;
}
function LinkedHashSet_init_$Create$_0(elements) {
  return LinkedHashSet_init_$Init$_0(elements, objectCreate(protoOf(LinkedHashSet)));
}
function LinkedHashSet_init_$Init$_1(initialCapacity, loadFactor, $this) {
  HashSet_init_$Init$_2(initialCapacity, loadFactor, $this);
  LinkedHashSet.call($this);
  return $this;
}
function LinkedHashSet_init_$Init$_2(initialCapacity, $this) {
  LinkedHashSet_init_$Init$_1(initialCapacity, 1.0, $this);
  return $this;
}
function LinkedHashSet_init_$Create$_1(initialCapacity) {
  return LinkedHashSet_init_$Init$_2(initialCapacity, objectCreate(protoOf(LinkedHashSet)));
}
protoOf(LinkedHashSet).c2 = function () {
  return this.g4_1.v3();
};
function LinkedHashSet() {
}
function Exception_init_$Init$($this) {
  extendThrowable($this);
  Exception.call($this);
  return $this;
}
function Exception_init_$Create$() {
  var tmp = Exception_init_$Init$(objectCreate(protoOf(Exception)));
  captureStack(tmp, Exception_init_$Create$);
  return tmp;
}
function Exception_init_$Init$_0(message, $this) {
  extendThrowable($this, message);
  Exception.call($this);
  return $this;
}
function Exception_init_$Create$_0(message) {
  var tmp = Exception_init_$Init$_0(message, objectCreate(protoOf(Exception)));
  captureStack(tmp, Exception_init_$Create$_0);
  return tmp;
}
function Exception() {
  captureStack(this, Exception);
}
function IllegalArgumentException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  IllegalArgumentException.call($this);
  return $this;
}
function IllegalArgumentException_init_$Create$() {
  var tmp = IllegalArgumentException_init_$Init$(objectCreate(protoOf(IllegalArgumentException)));
  captureStack(tmp, IllegalArgumentException_init_$Create$);
  return tmp;
}
function IllegalArgumentException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  IllegalArgumentException.call($this);
  return $this;
}
function IllegalArgumentException_init_$Create$_0(message) {
  var tmp = IllegalArgumentException_init_$Init$_0(message, objectCreate(protoOf(IllegalArgumentException)));
  captureStack(tmp, IllegalArgumentException_init_$Create$_0);
  return tmp;
}
function IllegalArgumentException() {
  captureStack(this, IllegalArgumentException);
}
function IllegalStateException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  IllegalStateException.call($this);
  return $this;
}
function IllegalStateException_init_$Create$() {
  var tmp = IllegalStateException_init_$Init$(objectCreate(protoOf(IllegalStateException)));
  captureStack(tmp, IllegalStateException_init_$Create$);
  return tmp;
}
function IllegalStateException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  IllegalStateException.call($this);
  return $this;
}
function IllegalStateException_init_$Create$_0(message) {
  var tmp = IllegalStateException_init_$Init$_0(message, objectCreate(protoOf(IllegalStateException)));
  captureStack(tmp, IllegalStateException_init_$Create$_0);
  return tmp;
}
function IllegalStateException() {
  captureStack(this, IllegalStateException);
}
function UnsupportedOperationException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  UnsupportedOperationException.call($this);
  return $this;
}
function UnsupportedOperationException_init_$Create$() {
  var tmp = UnsupportedOperationException_init_$Init$(objectCreate(protoOf(UnsupportedOperationException)));
  captureStack(tmp, UnsupportedOperationException_init_$Create$);
  return tmp;
}
function UnsupportedOperationException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  UnsupportedOperationException.call($this);
  return $this;
}
function UnsupportedOperationException_init_$Create$_0(message) {
  var tmp = UnsupportedOperationException_init_$Init$_0(message, objectCreate(protoOf(UnsupportedOperationException)));
  captureStack(tmp, UnsupportedOperationException_init_$Create$_0);
  return tmp;
}
function UnsupportedOperationException() {
  captureStack(this, UnsupportedOperationException);
}
function RuntimeException_init_$Init$($this) {
  Exception_init_$Init$($this);
  RuntimeException.call($this);
  return $this;
}
function RuntimeException_init_$Create$() {
  var tmp = RuntimeException_init_$Init$(objectCreate(protoOf(RuntimeException)));
  captureStack(tmp, RuntimeException_init_$Create$);
  return tmp;
}
function RuntimeException_init_$Init$_0(message, $this) {
  Exception_init_$Init$_0(message, $this);
  RuntimeException.call($this);
  return $this;
}
function RuntimeException_init_$Create$_0(message) {
  var tmp = RuntimeException_init_$Init$_0(message, objectCreate(protoOf(RuntimeException)));
  captureStack(tmp, RuntimeException_init_$Create$_0);
  return tmp;
}
function RuntimeException() {
  captureStack(this, RuntimeException);
}
function NoSuchElementException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  NoSuchElementException.call($this);
  return $this;
}
function NoSuchElementException_init_$Create$() {
  var tmp = NoSuchElementException_init_$Init$(objectCreate(protoOf(NoSuchElementException)));
  captureStack(tmp, NoSuchElementException_init_$Create$);
  return tmp;
}
function NoSuchElementException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  NoSuchElementException.call($this);
  return $this;
}
function NoSuchElementException_init_$Create$_0(message) {
  var tmp = NoSuchElementException_init_$Init$_0(message, objectCreate(protoOf(NoSuchElementException)));
  captureStack(tmp, NoSuchElementException_init_$Create$_0);
  return tmp;
}
function NoSuchElementException() {
  captureStack(this, NoSuchElementException);
}
function IndexOutOfBoundsException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  IndexOutOfBoundsException.call($this);
  return $this;
}
function IndexOutOfBoundsException_init_$Create$() {
  var tmp = IndexOutOfBoundsException_init_$Init$(objectCreate(protoOf(IndexOutOfBoundsException)));
  captureStack(tmp, IndexOutOfBoundsException_init_$Create$);
  return tmp;
}
function IndexOutOfBoundsException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  IndexOutOfBoundsException.call($this);
  return $this;
}
function IndexOutOfBoundsException_init_$Create$_0(message) {
  var tmp = IndexOutOfBoundsException_init_$Init$_0(message, objectCreate(protoOf(IndexOutOfBoundsException)));
  captureStack(tmp, IndexOutOfBoundsException_init_$Create$_0);
  return tmp;
}
function IndexOutOfBoundsException() {
  captureStack(this, IndexOutOfBoundsException);
}
function ArithmeticException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  ArithmeticException.call($this);
  return $this;
}
function ArithmeticException_init_$Create$() {
  var tmp = ArithmeticException_init_$Init$(objectCreate(protoOf(ArithmeticException)));
  captureStack(tmp, ArithmeticException_init_$Create$);
  return tmp;
}
function ArithmeticException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  ArithmeticException.call($this);
  return $this;
}
function ArithmeticException_init_$Create$_0(message) {
  var tmp = ArithmeticException_init_$Init$_0(message, objectCreate(protoOf(ArithmeticException)));
  captureStack(tmp, ArithmeticException_init_$Create$_0);
  return tmp;
}
function ArithmeticException() {
  captureStack(this, ArithmeticException);
}
function NumberFormatException_init_$Init$($this) {
  IllegalArgumentException_init_$Init$($this);
  NumberFormatException.call($this);
  return $this;
}
function NumberFormatException_init_$Create$() {
  var tmp = NumberFormatException_init_$Init$(objectCreate(protoOf(NumberFormatException)));
  captureStack(tmp, NumberFormatException_init_$Create$);
  return tmp;
}
function NumberFormatException_init_$Init$_0(message, $this) {
  IllegalArgumentException_init_$Init$_0(message, $this);
  NumberFormatException.call($this);
  return $this;
}
function NumberFormatException_init_$Create$_0(message) {
  var tmp = NumberFormatException_init_$Init$_0(message, objectCreate(protoOf(NumberFormatException)));
  captureStack(tmp, NumberFormatException_init_$Create$_0);
  return tmp;
}
function NumberFormatException() {
  captureStack(this, NumberFormatException);
}
function ConcurrentModificationException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  ConcurrentModificationException.call($this);
  return $this;
}
function ConcurrentModificationException_init_$Create$() {
  var tmp = ConcurrentModificationException_init_$Init$(objectCreate(protoOf(ConcurrentModificationException)));
  captureStack(tmp, ConcurrentModificationException_init_$Create$);
  return tmp;
}
function ConcurrentModificationException_init_$Init$_0(message, $this) {
  RuntimeException_init_$Init$_0(message, $this);
  ConcurrentModificationException.call($this);
  return $this;
}
function ConcurrentModificationException_init_$Create$_0(message) {
  var tmp = ConcurrentModificationException_init_$Init$_0(message, objectCreate(protoOf(ConcurrentModificationException)));
  captureStack(tmp, ConcurrentModificationException_init_$Create$_0);
  return tmp;
}
function ConcurrentModificationException() {
  captureStack(this, ConcurrentModificationException);
}
function NullPointerException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  NullPointerException.call($this);
  return $this;
}
function NullPointerException_init_$Create$() {
  var tmp = NullPointerException_init_$Init$(objectCreate(protoOf(NullPointerException)));
  captureStack(tmp, NullPointerException_init_$Create$);
  return tmp;
}
function NullPointerException() {
  captureStack(this, NullPointerException);
}
function ClassCastException_init_$Init$($this) {
  RuntimeException_init_$Init$($this);
  ClassCastException.call($this);
  return $this;
}
function ClassCastException_init_$Create$() {
  var tmp = ClassCastException_init_$Init$(objectCreate(protoOf(ClassCastException)));
  captureStack(tmp, ClassCastException_init_$Create$);
  return tmp;
}
function ClassCastException() {
  captureStack(this, ClassCastException);
}
function arrayPlusCollection(array, collection) {
  // Inline function 'kotlin.js.unsafeCast' call
  var result = array.slice();
  // Inline function 'kotlin.js.asDynamic' call
  result.length = result.length + collection.o() | 0;
  // Inline function 'kotlin.copyArrayType' call
  if (array.$type$ !== undefined) {
    result.$type$ = array.$type$;
  }
  var index = array.length;
  var _iterator__ex2g4s = collection.j();
  while (_iterator__ex2g4s.k()) {
    var element = _iterator__ex2g4s.l();
    var _unary__edvuaz = index;
    index = _unary__edvuaz + 1 | 0;
    result[_unary__edvuaz] = element;
  }
  return result;
}
function fillFrom(src, dst) {
  var srcLen = src.length;
  var dstLen = dst.length;
  var index = 0;
  // Inline function 'kotlin.js.unsafeCast' call
  var arr = dst;
  while (index < srcLen && index < dstLen) {
    var tmp = index;
    var _unary__edvuaz = index;
    index = _unary__edvuaz + 1 | 0;
    arr[tmp] = src[_unary__edvuaz];
  }
  return dst;
}
function arrayCopyResize(source, newSize, defaultValue) {
  // Inline function 'kotlin.js.unsafeCast' call
  var result = source.slice(0, newSize);
  // Inline function 'kotlin.copyArrayType' call
  if (source.$type$ !== undefined) {
    result.$type$ = source.$type$;
  }
  var index = source.length;
  if (newSize > index) {
    // Inline function 'kotlin.js.asDynamic' call
    result.length = newSize;
    while (index < newSize) {
      var _unary__edvuaz = index;
      index = _unary__edvuaz + 1 | 0;
      result[_unary__edvuaz] = defaultValue;
    }
  }
  return result;
}
function round(x) {
  if (!(x % 0.5 === 0.0)) {
    return Math.round(x);
  }
  // Inline function 'kotlin.math.floor' call
  var floor = Math.floor(x);
  var tmp;
  if (floor % 2 === 0.0) {
    tmp = floor;
  } else {
    // Inline function 'kotlin.math.ceil' call
    tmp = Math.ceil(x);
  }
  return tmp;
}
function roundToInt(_this__u8e3s4) {
  var tmp;
  if (isNaN_0(_this__u8e3s4)) {
    throw IllegalArgumentException_init_$Create$_0('Cannot round NaN value.');
  } else if (_this__u8e3s4 > 2147483647) {
    tmp = 2147483647;
  } else if (_this__u8e3s4 < -2147483648) {
    tmp = -2147483648;
  } else {
    tmp = numberToInt(Math.round(_this__u8e3s4));
  }
  return tmp;
}
function abs(n) {
  return n < 0 ? -n | 0 | 0 : n;
}
function StringBuilder_init_$Init$(capacity, $this) {
  StringBuilder_init_$Init$_0($this);
  return $this;
}
function StringBuilder_init_$Create$(capacity) {
  return StringBuilder_init_$Init$(capacity, objectCreate(protoOf(StringBuilder)));
}
function StringBuilder_init_$Init$_0($this) {
  StringBuilder.call($this, '');
  return $this;
}
function StringBuilder_init_$Create$_0() {
  return StringBuilder_init_$Init$_0(objectCreate(protoOf(StringBuilder)));
}
function StringBuilder(content) {
  this.p5_1 = content;
}
protoOf(StringBuilder).a = function () {
  // Inline function 'kotlin.js.asDynamic' call
  return this.p5_1.length;
};
protoOf(StringBuilder).b = function (index) {
  // Inline function 'kotlin.text.getOrElse' call
  var this_0 = this.p5_1;
  var tmp;
  if (0 <= index ? index <= (charSequenceLength(this_0) - 1 | 0) : false) {
    tmp = charSequenceGet(this_0, index);
  } else {
    throw IndexOutOfBoundsException_init_$Create$_0('index: ' + index + ', length: ' + this.a() + '}');
  }
  return tmp;
};
protoOf(StringBuilder).c = function (startIndex, endIndex) {
  return substring(this.p5_1, startIndex, endIndex);
};
protoOf(StringBuilder).s5 = function (value) {
  this.p5_1 = this.p5_1 + toString(value);
  return this;
};
protoOf(StringBuilder).i = function (value) {
  this.p5_1 = this.p5_1 + toString_0(value);
  return this;
};
protoOf(StringBuilder).q5 = function (value) {
  this.p5_1 = this.p5_1 + toString_0(value);
  return this;
};
protoOf(StringBuilder).r5 = function (value) {
  var tmp = this;
  var tmp_0 = this.p5_1;
  tmp.p5_1 = tmp_0 + (value == null ? 'null' : value);
  return this;
};
protoOf(StringBuilder).toString = function () {
  return this.p5_1;
};
function uppercaseChar(_this__u8e3s4) {
  // Inline function 'kotlin.text.uppercase' call
  // Inline function 'kotlin.js.asDynamic' call
  // Inline function 'kotlin.js.unsafeCast' call
  var uppercase = toString(_this__u8e3s4).toUpperCase();
  return uppercase.length > 1 ? _this__u8e3s4 : charCodeAt(uppercase, 0);
}
function checkRadix(radix) {
  if (!(2 <= radix ? radix <= 36 : false)) {
    throw IllegalArgumentException_init_$Create$_0('radix ' + radix + ' was not in valid range 2..36');
  }
  return radix;
}
function toInt(_this__u8e3s4) {
  var tmp0_elvis_lhs = toIntOrNull(_this__u8e3s4);
  var tmp;
  if (tmp0_elvis_lhs == null) {
    numberFormatError(_this__u8e3s4);
  } else {
    tmp = tmp0_elvis_lhs;
  }
  return tmp;
}
function digitOf(char, radix) {
  // Inline function 'kotlin.let' call
  var it = Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(48)) >= 0 && Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(57)) <= 0 ? Char__minus_impl_a2frrh(char, _Char___init__impl__6a9atx(48)) : Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(65)) >= 0 && Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(90)) <= 0 ? Char__minus_impl_a2frrh(char, _Char___init__impl__6a9atx(65)) + 10 | 0 : Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(97)) >= 0 && Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(122)) <= 0 ? Char__minus_impl_a2frrh(char, _Char___init__impl__6a9atx(97)) + 10 | 0 : Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(128)) < 0 ? -1 : Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(65313)) >= 0 && Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(65338)) <= 0 ? Char__minus_impl_a2frrh(char, _Char___init__impl__6a9atx(65313)) + 10 | 0 : Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(65345)) >= 0 && Char__compareTo_impl_ypi4mb(char, _Char___init__impl__6a9atx(65370)) <= 0 ? Char__minus_impl_a2frrh(char, _Char___init__impl__6a9atx(65345)) + 10 | 0 : digitToIntImpl(char);
  return it >= radix ? -1 : it;
}
var STRING_CASE_INSENSITIVE_ORDER;
function substring(_this__u8e3s4, startIndex, endIndex) {
  _init_properties_stringJs_kt__bg7zye();
  // Inline function 'kotlin.js.asDynamic' call
  return _this__u8e3s4.substring(startIndex, endIndex);
}
function substring_0(_this__u8e3s4, startIndex) {
  _init_properties_stringJs_kt__bg7zye();
  // Inline function 'kotlin.js.asDynamic' call
  return _this__u8e3s4.substring(startIndex);
}
function compareTo_0(_this__u8e3s4, other, ignoreCase) {
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  _init_properties_stringJs_kt__bg7zye();
  if (ignoreCase) {
    var n1 = _this__u8e3s4.length;
    var n2 = other.length;
    // Inline function 'kotlin.comparisons.minOf' call
    var min = Math.min(n1, n2);
    if (min === 0)
      return n1 - n2 | 0;
    var inductionVariable = 0;
    if (inductionVariable < min)
      do {
        var index = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        var thisChar = charCodeAt(_this__u8e3s4, index);
        var otherChar = charCodeAt(other, index);
        if (!(thisChar === otherChar)) {
          thisChar = uppercaseChar(thisChar);
          otherChar = uppercaseChar(otherChar);
          if (!(thisChar === otherChar)) {
            // Inline function 'kotlin.text.lowercaseChar' call
            // Inline function 'kotlin.text.lowercase' call
            var this_0 = thisChar;
            // Inline function 'kotlin.js.asDynamic' call
            // Inline function 'kotlin.js.unsafeCast' call
            var tmp$ret$3 = toString(this_0).toLowerCase();
            thisChar = charCodeAt(tmp$ret$3, 0);
            // Inline function 'kotlin.text.lowercaseChar' call
            // Inline function 'kotlin.text.lowercase' call
            var this_1 = otherChar;
            // Inline function 'kotlin.js.asDynamic' call
            // Inline function 'kotlin.js.unsafeCast' call
            var tmp$ret$7 = toString(this_1).toLowerCase();
            otherChar = charCodeAt(tmp$ret$7, 0);
            if (!(thisChar === otherChar)) {
              return Char__compareTo_impl_ypi4mb(thisChar, otherChar);
            }
          }
        }
      }
       while (inductionVariable < min);
    return n1 - n2 | 0;
  } else {
    return compareTo(_this__u8e3s4, other);
  }
}
function sam$kotlin_Comparator$0(function_0) {
  this.d6_1 = function_0;
}
protoOf(sam$kotlin_Comparator$0).e6 = function (a, b) {
  return this.d6_1(a, b);
};
protoOf(sam$kotlin_Comparator$0).compare = function (a, b) {
  return this.e6(a, b);
};
protoOf(sam$kotlin_Comparator$0).u1 = function () {
  return this.d6_1;
};
protoOf(sam$kotlin_Comparator$0).equals = function (other) {
  var tmp;
  if (!(other == null) ? isInterface(other, Comparator) : false) {
    var tmp_0;
    if (!(other == null) ? isInterface(other, FunctionAdapter) : false) {
      tmp_0 = equals(this.u1(), other.u1());
    } else {
      tmp_0 = false;
    }
    tmp = tmp_0;
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(sam$kotlin_Comparator$0).hashCode = function () {
  return hashCode(this.u1());
};
function STRING_CASE_INSENSITIVE_ORDER$lambda(a, b) {
  _init_properties_stringJs_kt__bg7zye();
  return compareTo_0(a, b, true);
}
var properties_initialized_stringJs_kt_nta8o4;
function _init_properties_stringJs_kt__bg7zye() {
  if (!properties_initialized_stringJs_kt_nta8o4) {
    properties_initialized_stringJs_kt_nta8o4 = true;
    var tmp = STRING_CASE_INSENSITIVE_ORDER$lambda;
    STRING_CASE_INSENSITIVE_ORDER = new sam$kotlin_Comparator$0(tmp);
  }
}
function regionMatches(_this__u8e3s4, thisOffset, other, otherOffset, length, ignoreCase) {
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  return regionMatchesImpl(_this__u8e3s4, thisOffset, other, otherOffset, length, ignoreCase);
}
function AbstractCollection$toString$lambda(this$0) {
  return function (it) {
    return it === this$0 ? '(this Collection)' : toString_0(it);
  };
}
function AbstractCollection() {
}
protoOf(AbstractCollection).t = function (element) {
  var tmp$ret$0;
  $l$block_0: {
    // Inline function 'kotlin.collections.any' call
    var tmp;
    if (isInterface(this, Collection)) {
      tmp = this.m();
    } else {
      tmp = false;
    }
    if (tmp) {
      tmp$ret$0 = false;
      break $l$block_0;
    }
    var _iterator__ex2g4s = this.j();
    while (_iterator__ex2g4s.k()) {
      var element_0 = _iterator__ex2g4s.l();
      if (equals(element_0, element)) {
        tmp$ret$0 = true;
        break $l$block_0;
      }
    }
    tmp$ret$0 = false;
  }
  return tmp$ret$0;
};
protoOf(AbstractCollection).u = function (elements) {
  var tmp$ret$0;
  $l$block_0: {
    // Inline function 'kotlin.collections.all' call
    var tmp;
    if (isInterface(elements, Collection)) {
      tmp = elements.m();
    } else {
      tmp = false;
    }
    if (tmp) {
      tmp$ret$0 = true;
      break $l$block_0;
    }
    var _iterator__ex2g4s = elements.j();
    while (_iterator__ex2g4s.k()) {
      var element = _iterator__ex2g4s.l();
      if (!this.t(element)) {
        tmp$ret$0 = false;
        break $l$block_0;
      }
    }
    tmp$ret$0 = true;
  }
  return tmp$ret$0;
};
protoOf(AbstractCollection).m = function () {
  return this.o() === 0;
};
protoOf(AbstractCollection).toString = function () {
  return joinToString_0(this, ', ', '[', ']', VOID, VOID, AbstractCollection$toString$lambda(this));
};
protoOf(AbstractCollection).toArray = function () {
  return collectionToArray(this);
};
function Companion_3() {
  this.y1_1 = 2147483639;
}
protoOf(Companion_3).u2 = function (index, size) {
  if (index < 0 || index >= size) {
    throw IndexOutOfBoundsException_init_$Create$_0('index: ' + index + ', size: ' + size);
  }
};
protoOf(Companion_3).k2 = function (index, size) {
  if (index < 0 || index > size) {
    throw IndexOutOfBoundsException_init_$Create$_0('index: ' + index + ', size: ' + size);
  }
};
protoOf(Companion_3).z1 = function (fromIndex, toIndex, size) {
  if (fromIndex < 0 || toIndex > size) {
    throw IndexOutOfBoundsException_init_$Create$_0('fromIndex: ' + fromIndex + ', toIndex: ' + toIndex + ', size: ' + size);
  }
  if (fromIndex > toIndex) {
    throw IllegalArgumentException_init_$Create$_0('fromIndex: ' + fromIndex + ' > toIndex: ' + toIndex);
  }
};
protoOf(Companion_3).u4 = function (oldCapacity, minCapacity) {
  var newCapacity = oldCapacity + (oldCapacity >> 1) | 0;
  if ((newCapacity - minCapacity | 0) < 0)
    newCapacity = minCapacity;
  if ((newCapacity - 2147483639 | 0) > 0)
    newCapacity = minCapacity > 2147483639 ? 2147483647 : 2147483639;
  return newCapacity;
};
protoOf(Companion_3).w2 = function (c) {
  var hashCode_0 = 1;
  var _iterator__ex2g4s = c.j();
  while (_iterator__ex2g4s.k()) {
    var e = _iterator__ex2g4s.l();
    var tmp = imul_0(31, hashCode_0);
    var tmp1_elvis_lhs = e == null ? null : hashCode(e);
    hashCode_0 = tmp + (tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs) | 0;
  }
  return hashCode_0;
};
protoOf(Companion_3).v2 = function (c, other) {
  if (!(c.o() === other.o()))
    return false;
  var otherIterator = other.j();
  var _iterator__ex2g4s = c.j();
  while (_iterator__ex2g4s.k()) {
    var elem = _iterator__ex2g4s.l();
    var elemOther = otherIterator.l();
    if (!equals(elem, elemOther)) {
      return false;
    }
  }
  return true;
};
var Companion_instance_3;
function Companion_getInstance_3() {
  return Companion_instance_3;
}
function AbstractMap$keys$1$iterator$1($entryIterator) {
  this.f6_1 = $entryIterator;
}
protoOf(AbstractMap$keys$1$iterator$1).k = function () {
  return this.f6_1.k();
};
protoOf(AbstractMap$keys$1$iterator$1).l = function () {
  return this.f6_1.l().a1();
};
function toString_2($this, entry) {
  return toString_3($this, entry.a1()) + '=' + toString_3($this, entry.b1());
}
function toString_3($this, o) {
  return o === $this ? '(this Map)' : toString_0(o);
}
function implFindEntry($this, key) {
  var tmp0 = $this.f1();
  var tmp$ret$1;
  $l$block: {
    // Inline function 'kotlin.collections.firstOrNull' call
    var _iterator__ex2g4s = tmp0.j();
    while (_iterator__ex2g4s.k()) {
      var element = _iterator__ex2g4s.l();
      if (equals(element.a1(), key)) {
        tmp$ret$1 = element;
        break $l$block;
      }
    }
    tmp$ret$1 = null;
  }
  return tmp$ret$1;
}
function Companion_4() {
}
var Companion_instance_4;
function Companion_getInstance_4() {
  return Companion_instance_4;
}
function AbstractMap$keys$1(this$0) {
  this.g6_1 = this$0;
  AbstractSet.call(this);
}
protoOf(AbstractMap$keys$1).s3 = function (element) {
  return this.g6_1.c1(element);
};
protoOf(AbstractMap$keys$1).t = function (element) {
  if (!(element == null ? true : !(element == null)))
    return false;
  return this.s3((element == null ? true : !(element == null)) ? element : THROW_CCE());
};
protoOf(AbstractMap$keys$1).j = function () {
  var entryIterator = this.g6_1.f1().j();
  return new AbstractMap$keys$1$iterator$1(entryIterator);
};
protoOf(AbstractMap$keys$1).o = function () {
  return this.g6_1.o();
};
function AbstractMap$toString$lambda(this$0) {
  return function (it) {
    return toString_2(this$0, it);
  };
}
function AbstractMap() {
  this.d3_1 = null;
  this.e3_1 = null;
}
protoOf(AbstractMap).c1 = function (key) {
  return !(implFindEntry(this, key) == null);
};
protoOf(AbstractMap).f3 = function (entry) {
  if (!(!(entry == null) ? isInterface(entry, Entry) : false))
    return false;
  var key = entry.a1();
  var value = entry.b1();
  // Inline function 'kotlin.collections.get' call
  var ourValue = (isInterface(this, KtMap) ? this : THROW_CCE()).d1(key);
  if (!equals(value, ourValue)) {
    return false;
  }
  var tmp;
  if (ourValue == null) {
    // Inline function 'kotlin.collections.containsKey' call
    tmp = !(isInterface(this, KtMap) ? this : THROW_CCE()).c1(key);
  } else {
    tmp = false;
  }
  if (tmp) {
    return false;
  }
  return true;
};
protoOf(AbstractMap).equals = function (other) {
  if (other === this)
    return true;
  if (!(!(other == null) ? isInterface(other, KtMap) : false))
    return false;
  if (!(this.o() === other.o()))
    return false;
  var tmp0 = other.f1();
  var tmp$ret$0;
  $l$block_0: {
    // Inline function 'kotlin.collections.all' call
    var tmp;
    if (isInterface(tmp0, Collection)) {
      tmp = tmp0.m();
    } else {
      tmp = false;
    }
    if (tmp) {
      tmp$ret$0 = true;
      break $l$block_0;
    }
    var _iterator__ex2g4s = tmp0.j();
    while (_iterator__ex2g4s.k()) {
      var element = _iterator__ex2g4s.l();
      if (!this.f3(element)) {
        tmp$ret$0 = false;
        break $l$block_0;
      }
    }
    tmp$ret$0 = true;
  }
  return tmp$ret$0;
};
protoOf(AbstractMap).d1 = function (key) {
  var tmp0_safe_receiver = implFindEntry(this, key);
  return tmp0_safe_receiver == null ? null : tmp0_safe_receiver.b1();
};
protoOf(AbstractMap).hashCode = function () {
  return hashCode(this.f1());
};
protoOf(AbstractMap).m = function () {
  return this.o() === 0;
};
protoOf(AbstractMap).o = function () {
  return this.f1().o();
};
protoOf(AbstractMap).e1 = function () {
  if (this.d3_1 == null) {
    var tmp = this;
    tmp.d3_1 = new AbstractMap$keys$1(this);
  }
  return ensureNotNull(this.d3_1);
};
protoOf(AbstractMap).toString = function () {
  var tmp = this.f1();
  return joinToString_0(tmp, ', ', '{', '}', VOID, VOID, AbstractMap$toString$lambda(this));
};
function Companion_5() {
}
protoOf(Companion_5).h3 = function (c) {
  var hashCode_0 = 0;
  var _iterator__ex2g4s = c.j();
  while (_iterator__ex2g4s.k()) {
    var element = _iterator__ex2g4s.l();
    var tmp = hashCode_0;
    var tmp1_elvis_lhs = element == null ? null : hashCode(element);
    hashCode_0 = tmp + (tmp1_elvis_lhs == null ? 0 : tmp1_elvis_lhs) | 0;
  }
  return hashCode_0;
};
protoOf(Companion_5).g3 = function (c, other) {
  if (!(c.o() === other.o()))
    return false;
  return c.u(other);
};
var Companion_instance_5;
function Companion_getInstance_5() {
  return Companion_instance_5;
}
function AbstractSet() {
  AbstractCollection.call(this);
}
protoOf(AbstractSet).equals = function (other) {
  if (other === this)
    return true;
  if (!(!(other == null) ? isInterface(other, KtSet) : false))
    return false;
  return Companion_instance_5.g3(this, other);
};
protoOf(AbstractSet).hashCode = function () {
  return Companion_instance_5.h3(this);
};
function ArrayDeque_init_$Init$($this) {
  AbstractMutableList.call($this);
  ArrayDeque.call($this);
  $this.j6_1 = Companion_getInstance_6().l6_1;
  return $this;
}
function ArrayDeque_init_$Create$() {
  return ArrayDeque_init_$Init$(objectCreate(protoOf(ArrayDeque)));
}
function ensureCapacity_0($this, minCapacity) {
  if (minCapacity < 0)
    throw IllegalStateException_init_$Create$_0('Deque is too big.');
  if (minCapacity <= $this.j6_1.length)
    return Unit_instance;
  if ($this.j6_1 === Companion_getInstance_6().l6_1) {
    var tmp = $this;
    // Inline function 'kotlin.arrayOfNulls' call
    var size = coerceAtLeast(minCapacity, 10);
    tmp.j6_1 = Array(size);
    return Unit_instance;
  }
  var newCapacity = Companion_instance_3.u4($this.j6_1.length, minCapacity);
  copyElements($this, newCapacity);
}
function copyElements($this, newCapacity) {
  // Inline function 'kotlin.arrayOfNulls' call
  var newElements = Array(newCapacity);
  var tmp0 = $this.j6_1;
  var tmp6 = $this.i6_1;
  // Inline function 'kotlin.collections.copyInto' call
  var endIndex = $this.j6_1.length;
  arrayCopy(tmp0, newElements, 0, tmp6, endIndex);
  var tmp0_0 = $this.j6_1;
  var tmp4 = $this.j6_1.length - $this.i6_1 | 0;
  // Inline function 'kotlin.collections.copyInto' call
  var endIndex_0 = $this.i6_1;
  arrayCopy(tmp0_0, newElements, tmp4, 0, endIndex_0);
  $this.i6_1 = 0;
  $this.j6_1 = newElements;
}
function positiveMod($this, index) {
  return index >= $this.j6_1.length ? index - $this.j6_1.length | 0 : index;
}
function incremented($this, index) {
  return index === get_lastIndex($this.j6_1) ? 0 : index + 1 | 0;
}
function decremented($this, index) {
  return index === 0 ? get_lastIndex($this.j6_1) : index - 1 | 0;
}
function copyCollectionElements($this, internalIndex, elements) {
  var iterator = elements.j();
  var inductionVariable = internalIndex;
  var last = $this.j6_1.length;
  if (inductionVariable < last)
    $l$loop: do {
      var index = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      if (!iterator.k())
        break $l$loop;
      $this.j6_1[index] = iterator.l();
    }
     while (inductionVariable < last);
  var inductionVariable_0 = 0;
  var last_0 = $this.i6_1;
  if (inductionVariable_0 < last_0)
    $l$loop_0: do {
      var index_0 = inductionVariable_0;
      inductionVariable_0 = inductionVariable_0 + 1 | 0;
      if (!iterator.k())
        break $l$loop_0;
      $this.j6_1[index_0] = iterator.l();
    }
     while (inductionVariable_0 < last_0);
  $this.k6_1 = $this.k6_1 + elements.o() | 0;
}
function nullifyNonEmpty($this, internalFromIndex, internalToIndex) {
  if (internalFromIndex < internalToIndex) {
    fill($this.j6_1, null, internalFromIndex, internalToIndex);
  } else {
    fill($this.j6_1, null, internalFromIndex, $this.j6_1.length);
    fill($this.j6_1, null, 0, internalToIndex);
  }
}
function registerModification_0($this) {
  $this.t2_1 = $this.t2_1 + 1 | 0;
}
function Companion_6() {
  Companion_instance_6 = this;
  var tmp = this;
  // Inline function 'kotlin.emptyArray' call
  tmp.l6_1 = [];
  this.m6_1 = 10;
}
var Companion_instance_6;
function Companion_getInstance_6() {
  if (Companion_instance_6 == null)
    new Companion_6();
  return Companion_instance_6;
}
protoOf(ArrayDeque).o = function () {
  return this.k6_1;
};
protoOf(ArrayDeque).m = function () {
  return this.k6_1 === 0;
};
protoOf(ArrayDeque).n6 = function (element) {
  registerModification_0(this);
  ensureCapacity_0(this, this.k6_1 + 1 | 0);
  this.i6_1 = decremented(this, this.i6_1);
  this.j6_1[this.i6_1] = element;
  this.k6_1 = this.k6_1 + 1 | 0;
};
protoOf(ArrayDeque).o6 = function (element) {
  registerModification_0(this);
  ensureCapacity_0(this, this.k6_1 + 1 | 0);
  var tmp = this.j6_1;
  // Inline function 'kotlin.collections.ArrayDeque.internalIndex' call
  var index = this.k6_1;
  tmp[positiveMod(this, this.i6_1 + index | 0)] = element;
  this.k6_1 = this.k6_1 + 1 | 0;
};
protoOf(ArrayDeque).p6 = function () {
  if (this.m())
    throw NoSuchElementException_init_$Create$_0('ArrayDeque is empty.');
  registerModification_0(this);
  // Inline function 'kotlin.collections.ArrayDeque.internalGet' call
  var internalIndex = this.i6_1;
  var tmp = this.j6_1[internalIndex];
  var element = (tmp == null ? true : !(tmp == null)) ? tmp : THROW_CCE();
  this.j6_1[this.i6_1] = null;
  this.i6_1 = incremented(this, this.i6_1);
  this.k6_1 = this.k6_1 - 1 | 0;
  return element;
};
protoOf(ArrayDeque).h = function (element) {
  this.o6(element);
  return true;
};
protoOf(ArrayDeque).s2 = function (index, element) {
  Companion_instance_3.k2(index, this.k6_1);
  if (index === this.k6_1) {
    this.o6(element);
    return Unit_instance;
  } else if (index === 0) {
    this.n6(element);
    return Unit_instance;
  }
  registerModification_0(this);
  ensureCapacity_0(this, this.k6_1 + 1 | 0);
  // Inline function 'kotlin.collections.ArrayDeque.internalIndex' call
  var internalIndex = positiveMod(this, this.i6_1 + index | 0);
  if (index < (this.k6_1 + 1 | 0) >> 1) {
    var decrementedInternalIndex = decremented(this, internalIndex);
    var decrementedHead = decremented(this, this.i6_1);
    if (decrementedInternalIndex >= this.i6_1) {
      this.j6_1[decrementedHead] = this.j6_1[this.i6_1];
      var tmp0 = this.j6_1;
      var tmp2 = this.j6_1;
      var tmp4 = this.i6_1;
      var tmp6 = this.i6_1 + 1 | 0;
      // Inline function 'kotlin.collections.copyInto' call
      var endIndex = decrementedInternalIndex + 1 | 0;
      arrayCopy(tmp0, tmp2, tmp4, tmp6, endIndex);
    } else {
      var tmp0_0 = this.j6_1;
      var tmp2_0 = this.j6_1;
      var tmp4_0 = this.i6_1 - 1 | 0;
      var tmp6_0 = this.i6_1;
      // Inline function 'kotlin.collections.copyInto' call
      var endIndex_0 = this.j6_1.length;
      arrayCopy(tmp0_0, tmp2_0, tmp4_0, tmp6_0, endIndex_0);
      this.j6_1[this.j6_1.length - 1 | 0] = this.j6_1[0];
      var tmp0_1 = this.j6_1;
      var tmp2_1 = this.j6_1;
      // Inline function 'kotlin.collections.copyInto' call
      var endIndex_1 = decrementedInternalIndex + 1 | 0;
      arrayCopy(tmp0_1, tmp2_1, 0, 1, endIndex_1);
    }
    this.j6_1[decrementedInternalIndex] = element;
    this.i6_1 = decrementedHead;
  } else {
    // Inline function 'kotlin.collections.ArrayDeque.internalIndex' call
    var index_0 = this.k6_1;
    var tail = positiveMod(this, this.i6_1 + index_0 | 0);
    if (internalIndex < tail) {
      var tmp0_2 = this.j6_1;
      var tmp2_2 = this.j6_1;
      // Inline function 'kotlin.collections.copyInto' call
      var destinationOffset = internalIndex + 1 | 0;
      arrayCopy(tmp0_2, tmp2_2, destinationOffset, internalIndex, tail);
    } else {
      var tmp0_3 = this.j6_1;
      // Inline function 'kotlin.collections.copyInto' call
      var destination = this.j6_1;
      arrayCopy(tmp0_3, destination, 1, 0, tail);
      this.j6_1[0] = this.j6_1[this.j6_1.length - 1 | 0];
      var tmp0_4 = this.j6_1;
      var tmp2_3 = this.j6_1;
      var tmp4_1 = internalIndex + 1 | 0;
      // Inline function 'kotlin.collections.copyInto' call
      var endIndex_2 = this.j6_1.length - 1 | 0;
      arrayCopy(tmp0_4, tmp2_3, tmp4_1, internalIndex, endIndex_2);
    }
    this.j6_1[internalIndex] = element;
  }
  this.k6_1 = this.k6_1 + 1 | 0;
};
protoOf(ArrayDeque).p = function (elements) {
  if (elements.m())
    return false;
  registerModification_0(this);
  ensureCapacity_0(this, this.k6_1 + elements.o() | 0);
  // Inline function 'kotlin.collections.ArrayDeque.internalIndex' call
  var index = this.k6_1;
  var tmp$ret$0 = positiveMod(this, this.i6_1 + index | 0);
  copyCollectionElements(this, tmp$ret$0, elements);
  return true;
};
protoOf(ArrayDeque).n = function (index) {
  Companion_instance_3.u2(index, this.k6_1);
  // Inline function 'kotlin.collections.ArrayDeque.internalIndex' call
  // Inline function 'kotlin.collections.ArrayDeque.internalGet' call
  var internalIndex = positiveMod(this, this.i6_1 + index | 0);
  var tmp = this.j6_1[internalIndex];
  return (tmp == null ? true : !(tmp == null)) ? tmp : THROW_CCE();
};
protoOf(ArrayDeque).b2 = function (index, element) {
  Companion_instance_3.u2(index, this.k6_1);
  // Inline function 'kotlin.collections.ArrayDeque.internalIndex' call
  var internalIndex = positiveMod(this, this.i6_1 + index | 0);
  // Inline function 'kotlin.collections.ArrayDeque.internalGet' call
  var tmp = this.j6_1[internalIndex];
  var oldElement = (tmp == null ? true : !(tmp == null)) ? tmp : THROW_CCE();
  this.j6_1[internalIndex] = element;
  return oldElement;
};
protoOf(ArrayDeque).t = function (element) {
  return !(this.v(element) === -1);
};
protoOf(ArrayDeque).v = function (element) {
  // Inline function 'kotlin.collections.ArrayDeque.internalIndex' call
  var index = this.k6_1;
  var tail = positiveMod(this, this.i6_1 + index | 0);
  if (this.i6_1 < tail) {
    var inductionVariable = this.i6_1;
    if (inductionVariable < tail)
      do {
        var index_0 = inductionVariable;
        inductionVariable = inductionVariable + 1 | 0;
        if (equals(element, this.j6_1[index_0]))
          return index_0 - this.i6_1 | 0;
      }
       while (inductionVariable < tail);
  } else if (this.i6_1 >= tail) {
    var inductionVariable_0 = this.i6_1;
    var last = this.j6_1.length;
    if (inductionVariable_0 < last)
      do {
        var index_1 = inductionVariable_0;
        inductionVariable_0 = inductionVariable_0 + 1 | 0;
        if (equals(element, this.j6_1[index_1]))
          return index_1 - this.i6_1 | 0;
      }
       while (inductionVariable_0 < last);
    var inductionVariable_1 = 0;
    if (inductionVariable_1 < tail)
      do {
        var index_2 = inductionVariable_1;
        inductionVariable_1 = inductionVariable_1 + 1 | 0;
        if (equals(element, this.j6_1[index_2]))
          return (index_2 + this.j6_1.length | 0) - this.i6_1 | 0;
      }
       while (inductionVariable_1 < tail);
  }
  return -1;
};
protoOf(ArrayDeque).w = function (element) {
  // Inline function 'kotlin.collections.ArrayDeque.internalIndex' call
  var index = this.k6_1;
  var tail = positiveMod(this, this.i6_1 + index | 0);
  if (this.i6_1 < tail) {
    var inductionVariable = tail - 1 | 0;
    var last = this.i6_1;
    if (last <= inductionVariable)
      do {
        var index_0 = inductionVariable;
        inductionVariable = inductionVariable + -1 | 0;
        if (equals(element, this.j6_1[index_0]))
          return index_0 - this.i6_1 | 0;
      }
       while (!(index_0 === last));
  } else if (this.i6_1 > tail) {
    var inductionVariable_0 = tail - 1 | 0;
    if (0 <= inductionVariable_0)
      do {
        var index_1 = inductionVariable_0;
        inductionVariable_0 = inductionVariable_0 + -1 | 0;
        if (equals(element, this.j6_1[index_1]))
          return (index_1 + this.j6_1.length | 0) - this.i6_1 | 0;
      }
       while (0 <= inductionVariable_0);
    var inductionVariable_1 = get_lastIndex(this.j6_1);
    var last_0 = this.i6_1;
    if (last_0 <= inductionVariable_1)
      do {
        var index_2 = inductionVariable_1;
        inductionVariable_1 = inductionVariable_1 + -1 | 0;
        if (equals(element, this.j6_1[index_2]))
          return index_2 - this.i6_1 | 0;
      }
       while (!(index_2 === last_0));
  }
  return -1;
};
protoOf(ArrayDeque).k3 = function () {
  // Inline function 'kotlin.collections.isNotEmpty' call
  if (!this.m()) {
    registerModification_0(this);
    // Inline function 'kotlin.collections.ArrayDeque.internalIndex' call
    var index = this.k6_1;
    var tail = positiveMod(this, this.i6_1 + index | 0);
    nullifyNonEmpty(this, this.i6_1, tail);
  }
  this.i6_1 = 0;
  this.k6_1 = 0;
};
protoOf(ArrayDeque).q6 = function (array) {
  var tmp = array.length >= this.k6_1 ? array : arrayOfNulls(array, this.k6_1);
  var dest = isArray(tmp) ? tmp : THROW_CCE();
  // Inline function 'kotlin.collections.ArrayDeque.internalIndex' call
  var index = this.k6_1;
  var tail = positiveMod(this, this.i6_1 + index | 0);
  if (this.i6_1 < tail) {
    var tmp0 = this.j6_1;
    // Inline function 'kotlin.collections.copyInto' call
    var startIndex = this.i6_1;
    arrayCopy(tmp0, dest, 0, startIndex, tail);
  } else {
    // Inline function 'kotlin.collections.isNotEmpty' call
    if (!this.m()) {
      var tmp0_0 = this.j6_1;
      var tmp6 = this.i6_1;
      // Inline function 'kotlin.collections.copyInto' call
      var endIndex = this.j6_1.length;
      arrayCopy(tmp0_0, dest, 0, tmp6, endIndex);
      var tmp0_1 = this.j6_1;
      // Inline function 'kotlin.collections.copyInto' call
      var destinationOffset = this.j6_1.length - this.i6_1 | 0;
      arrayCopy(tmp0_1, dest, destinationOffset, 0, tail);
    }
  }
  var tmp_0 = terminateCollectionToArray(this.k6_1, dest);
  return isArray(tmp_0) ? tmp_0 : THROW_CCE();
};
protoOf(ArrayDeque).l3 = function () {
  // Inline function 'kotlin.arrayOfNulls' call
  var size = this.k6_1;
  var tmp$ret$0 = Array(size);
  return this.q6(tmp$ret$0);
};
protoOf(ArrayDeque).toArray = function () {
  return this.l3();
};
function ArrayDeque() {
  Companion_getInstance_6();
  this.i6_1 = 0;
  this.k6_1 = 0;
}
function collectionToArrayCommonImpl(collection) {
  if (collection.m()) {
    // Inline function 'kotlin.emptyArray' call
    return [];
  }
  // Inline function 'kotlin.arrayOfNulls' call
  var size = collection.o();
  var destination = Array(size);
  var iterator = collection.j();
  var index = 0;
  while (iterator.k()) {
    var _unary__edvuaz = index;
    index = _unary__edvuaz + 1 | 0;
    destination[_unary__edvuaz] = iterator.l();
  }
  return destination;
}
function listOf_0(elements) {
  return elements.length > 0 ? asList(elements) : emptyList();
}
function mutableListOf(elements) {
  var tmp;
  if (elements.length === 0) {
    tmp = ArrayList_init_$Create$();
  } else {
    // Inline function 'kotlin.collections.asArrayList' call
    // Inline function 'kotlin.js.unsafeCast' call
    // Inline function 'kotlin.js.asDynamic' call
    tmp = new ArrayList(elements);
  }
  return tmp;
}
function emptyList() {
  return EmptyList_getInstance();
}
function asCollection(_this__u8e3s4, isVarargs) {
  isVarargs = isVarargs === VOID ? false : isVarargs;
  return new ArrayAsCollection(_this__u8e3s4, isVarargs);
}
function get_lastIndex_0(_this__u8e3s4) {
  return _this__u8e3s4.o() - 1 | 0;
}
function EmptyList() {
  EmptyList_instance = this;
  this.r6_1 = new Long(-1478467534, -1720727600);
}
protoOf(EmptyList).equals = function (other) {
  var tmp;
  if (!(other == null) ? isInterface(other, KtList_0) : false) {
    tmp = other.m();
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(EmptyList).hashCode = function () {
  return 1;
};
protoOf(EmptyList).toString = function () {
  return '[]';
};
protoOf(EmptyList).o = function () {
  return 0;
};
protoOf(EmptyList).m = function () {
  return true;
};
protoOf(EmptyList).s6 = function (element) {
  return false;
};
protoOf(EmptyList).t = function (element) {
  if (!false)
    return false;
  var tmp;
  if (false) {
    tmp = element;
  } else {
    tmp = THROW_CCE();
  }
  return this.s6(tmp);
};
protoOf(EmptyList).t6 = function (elements) {
  return elements.m();
};
protoOf(EmptyList).u = function (elements) {
  return this.t6(elements);
};
protoOf(EmptyList).n = function (index) {
  throw IndexOutOfBoundsException_init_$Create$_0("Empty list doesn't contain element at index " + index + '.');
};
protoOf(EmptyList).u6 = function (element) {
  return -1;
};
protoOf(EmptyList).v = function (element) {
  if (!false)
    return -1;
  var tmp;
  if (false) {
    tmp = element;
  } else {
    tmp = THROW_CCE();
  }
  return this.u6(tmp);
};
protoOf(EmptyList).v6 = function (element) {
  return -1;
};
protoOf(EmptyList).w = function (element) {
  if (!false)
    return -1;
  var tmp;
  if (false) {
    tmp = element;
  } else {
    tmp = THROW_CCE();
  }
  return this.v6(tmp);
};
protoOf(EmptyList).j = function () {
  return EmptyIterator_instance;
};
protoOf(EmptyList).x = function () {
  return EmptyIterator_instance;
};
protoOf(EmptyList).y = function (index) {
  if (!(index === 0))
    throw IndexOutOfBoundsException_init_$Create$_0('Index: ' + index);
  return EmptyIterator_instance;
};
protoOf(EmptyList).z = function (fromIndex, toIndex) {
  if (fromIndex === 0 && toIndex === 0)
    return this;
  throw IndexOutOfBoundsException_init_$Create$_0('fromIndex: ' + fromIndex + ', toIndex: ' + toIndex);
};
var EmptyList_instance;
function EmptyList_getInstance() {
  if (EmptyList_instance == null)
    new EmptyList();
  return EmptyList_instance;
}
function ArrayAsCollection(values, isVarargs) {
  this.w6_1 = values;
  this.x6_1 = isVarargs;
}
protoOf(ArrayAsCollection).o = function () {
  return this.w6_1.length;
};
protoOf(ArrayAsCollection).m = function () {
  // Inline function 'kotlin.collections.isEmpty' call
  return this.w6_1.length === 0;
};
protoOf(ArrayAsCollection).j = function () {
  return arrayIterator(this.w6_1);
};
function EmptyIterator() {
}
protoOf(EmptyIterator).k = function () {
  return false;
};
protoOf(EmptyIterator).l2 = function () {
  return false;
};
protoOf(EmptyIterator).m2 = function () {
  return 0;
};
protoOf(EmptyIterator).l = function () {
  throw NoSuchElementException_init_$Create$();
};
protoOf(EmptyIterator).n2 = function () {
  throw NoSuchElementException_init_$Create$();
};
var EmptyIterator_instance;
function EmptyIterator_getInstance() {
  return EmptyIterator_instance;
}
function optimizeReadOnlyList(_this__u8e3s4) {
  switch (_this__u8e3s4.o()) {
    case 0:
      return emptyList();
    case 1:
      return listOf(_this__u8e3s4.n(0));
    default:
      return _this__u8e3s4;
  }
}
function throwIndexOverflow() {
  throw ArithmeticException_init_$Create$_0('Index overflow has happened.');
}
function IndexedValue(index, value) {
  this.y6_1 = index;
  this.z6_1 = value;
}
protoOf(IndexedValue).a7 = function () {
  return this.y6_1;
};
protoOf(IndexedValue).b7 = function () {
  return this.z6_1;
};
protoOf(IndexedValue).toString = function () {
  return 'IndexedValue(index=' + this.y6_1 + ', value=' + toString_0(this.z6_1) + ')';
};
protoOf(IndexedValue).hashCode = function () {
  var result = this.y6_1;
  result = imul_0(result, 31) + (this.z6_1 == null ? 0 : hashCode(this.z6_1)) | 0;
  return result;
};
protoOf(IndexedValue).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof IndexedValue))
    return false;
  var tmp0_other_with_cast = other instanceof IndexedValue ? other : THROW_CCE();
  if (!(this.y6_1 === tmp0_other_with_cast.y6_1))
    return false;
  if (!equals(this.z6_1, tmp0_other_with_cast.z6_1))
    return false;
  return true;
};
function IndexingIterable(iteratorFactory) {
  this.c7_1 = iteratorFactory;
}
protoOf(IndexingIterable).j = function () {
  return new IndexingIterator(this.c7_1());
};
function collectionSizeOrDefault(_this__u8e3s4, default_0) {
  var tmp;
  if (isInterface(_this__u8e3s4, Collection)) {
    tmp = _this__u8e3s4.o();
  } else {
    tmp = default_0;
  }
  return tmp;
}
function IndexingIterator(iterator) {
  this.d7_1 = iterator;
  this.e7_1 = 0;
}
protoOf(IndexingIterator).k = function () {
  return this.d7_1.k();
};
protoOf(IndexingIterator).l = function () {
  var _unary__edvuaz = this.e7_1;
  this.e7_1 = _unary__edvuaz + 1 | 0;
  return new IndexedValue(checkIndexOverflow(_unary__edvuaz), this.d7_1.l());
};
function getOrImplicitDefault(_this__u8e3s4, key) {
  if (isInterface(_this__u8e3s4, MapWithDefault))
    return _this__u8e3s4.f7(key);
  var tmp$ret$0;
  $l$block: {
    // Inline function 'kotlin.collections.getOrElseNullable' call
    var value = _this__u8e3s4.d1(key);
    if (value == null && !_this__u8e3s4.c1(key)) {
      throw NoSuchElementException_init_$Create$_0('Key ' + toString_0(key) + ' is missing in the map.');
    } else {
      tmp$ret$0 = (value == null ? true : !(value == null)) ? value : THROW_CCE();
      break $l$block;
    }
  }
  return tmp$ret$0;
}
function MapWithDefault() {
}
function mapOf(pairs) {
  return pairs.length > 0 ? toMap(pairs, LinkedHashMap_init_$Create$_0(mapCapacity(pairs.length))) : emptyMap();
}
function getValue(_this__u8e3s4, key) {
  return getOrImplicitDefault(_this__u8e3s4, key);
}
function toMap(_this__u8e3s4, destination) {
  // Inline function 'kotlin.apply' call
  putAll(destination, _this__u8e3s4);
  return destination;
}
function emptyMap() {
  var tmp = EmptyMap_getInstance();
  return isInterface(tmp, KtMap) ? tmp : THROW_CCE();
}
function putAll(_this__u8e3s4, pairs) {
  var inductionVariable = 0;
  var last = pairs.length;
  while (inductionVariable < last) {
    var _destruct__k2r9zo = pairs[inductionVariable];
    inductionVariable = inductionVariable + 1 | 0;
    var key = _destruct__k2r9zo.a7();
    var value = _destruct__k2r9zo.b7();
    _this__u8e3s4.c3(key, value);
  }
}
function EmptyMap() {
  EmptyMap_instance = this;
  this.i7_1 = new Long(-888910638, 1920087921);
}
protoOf(EmptyMap).equals = function (other) {
  var tmp;
  if (!(other == null) ? isInterface(other, KtMap) : false) {
    tmp = other.m();
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(EmptyMap).hashCode = function () {
  return 0;
};
protoOf(EmptyMap).toString = function () {
  return '{}';
};
protoOf(EmptyMap).o = function () {
  return 0;
};
protoOf(EmptyMap).m = function () {
  return true;
};
protoOf(EmptyMap).j7 = function (key) {
  return false;
};
protoOf(EmptyMap).c1 = function (key) {
  if (!(key == null ? true : !(key == null)))
    return false;
  return this.j7((key == null ? true : !(key == null)) ? key : THROW_CCE());
};
protoOf(EmptyMap).k7 = function (key) {
  return null;
};
protoOf(EmptyMap).d1 = function (key) {
  if (!(key == null ? true : !(key == null)))
    return null;
  return this.k7((key == null ? true : !(key == null)) ? key : THROW_CCE());
};
protoOf(EmptyMap).f1 = function () {
  return EmptySet_getInstance();
};
protoOf(EmptyMap).e1 = function () {
  return EmptySet_getInstance();
};
var EmptyMap_instance;
function EmptyMap_getInstance() {
  if (EmptyMap_instance == null)
    new EmptyMap();
  return EmptyMap_instance;
}
function addAll(_this__u8e3s4, elements) {
  if (isInterface(elements, Collection))
    return _this__u8e3s4.p(elements);
  else {
    var result = false;
    var _iterator__ex2g4s = elements.j();
    while (_iterator__ex2g4s.k()) {
      var item = _iterator__ex2g4s.l();
      if (_this__u8e3s4.h(item))
        result = true;
    }
    return result;
  }
}
function IntIterator() {
}
protoOf(IntIterator).l = function () {
  return this.l7();
};
function setOf_0(elements) {
  return toSet(elements);
}
function emptySet() {
  return EmptySet_getInstance();
}
function optimizeReadOnlySet(_this__u8e3s4) {
  switch (_this__u8e3s4.o()) {
    case 0:
      return emptySet();
    case 1:
      return setOf(_this__u8e3s4.j().l());
    default:
      return _this__u8e3s4;
  }
}
function hashSetOf(elements) {
  return toCollection(elements, HashSet_init_$Create$_0(mapCapacity(elements.length)));
}
function EmptySet() {
  EmptySet_instance = this;
  this.m7_1 = new Long(1993859828, 793161749);
}
protoOf(EmptySet).equals = function (other) {
  var tmp;
  if (!(other == null) ? isInterface(other, KtSet) : false) {
    tmp = other.m();
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(EmptySet).hashCode = function () {
  return 0;
};
protoOf(EmptySet).toString = function () {
  return '[]';
};
protoOf(EmptySet).o = function () {
  return 0;
};
protoOf(EmptySet).m = function () {
  return true;
};
protoOf(EmptySet).s6 = function (element) {
  return false;
};
protoOf(EmptySet).t = function (element) {
  if (!false)
    return false;
  var tmp;
  if (false) {
    tmp = element;
  } else {
    tmp = THROW_CCE();
  }
  return this.s6(tmp);
};
protoOf(EmptySet).t6 = function (elements) {
  return elements.m();
};
protoOf(EmptySet).u = function (elements) {
  return this.t6(elements);
};
protoOf(EmptySet).j = function () {
  return EmptyIterator_instance;
};
var EmptySet_instance;
function EmptySet_getInstance() {
  if (EmptySet_instance == null)
    new EmptySet();
  return EmptySet_instance;
}
function naturalOrder() {
  var tmp = NaturalOrderComparator_instance;
  return isInterface(tmp, Comparator) ? tmp : THROW_CCE();
}
function NaturalOrderComparator() {
}
protoOf(NaturalOrderComparator).n7 = function (a, b) {
  return compareTo(a, b);
};
protoOf(NaturalOrderComparator).compare = function (a, b) {
  var tmp = (!(a == null) ? isComparable(a) : false) ? a : THROW_CCE();
  return this.n7(tmp, (!(b == null) ? isComparable(b) : false) ? b : THROW_CCE());
};
var NaturalOrderComparator_instance;
function NaturalOrderComparator_getInstance() {
  return NaturalOrderComparator_instance;
}
function compareValues(a, b) {
  if (a === b)
    return 0;
  if (a == null)
    return -1;
  if (b == null)
    return 1;
  return compareTo((!(a == null) ? isComparable(a) : false) ? a : THROW_CCE(), b);
}
function getProgressionLastElement(start, end, step) {
  var tmp;
  if (step > 0) {
    tmp = start >= end ? end : end - differenceModulo(end, start, step) | 0;
  } else if (step < 0) {
    tmp = start <= end ? end : end + differenceModulo(start, end, -step | 0) | 0;
  } else {
    throw IllegalArgumentException_init_$Create$_0('Step is zero.');
  }
  return tmp;
}
function differenceModulo(a, b, c) {
  return mod(mod(a, c) - mod(b, c) | 0, c);
}
function mod(a, b) {
  var mod = a % b | 0;
  return mod >= 0 ? mod : mod + b | 0;
}
function Companion_7() {
  Companion_instance_7 = this;
  this.q_1 = new IntRange(1, 0);
}
var Companion_instance_7;
function Companion_getInstance_7() {
  if (Companion_instance_7 == null)
    new Companion_7();
  return Companion_instance_7;
}
function IntRange(start, endInclusive) {
  Companion_getInstance_7();
  IntProgression.call(this, start, endInclusive, 1);
}
protoOf(IntRange).r7 = function () {
  return this.s7_1;
};
protoOf(IntRange).v7 = function () {
  return this.t7_1;
};
protoOf(IntRange).m = function () {
  return this.s7_1 > this.t7_1;
};
protoOf(IntRange).equals = function (other) {
  var tmp;
  if (other instanceof IntRange) {
    tmp = this.m() && other.m() || (this.s7_1 === other.s7_1 && this.t7_1 === other.t7_1);
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(IntRange).hashCode = function () {
  return this.m() ? -1 : imul_0(31, this.s7_1) + this.t7_1 | 0;
};
protoOf(IntRange).toString = function () {
  return '' + this.s7_1 + '..' + this.t7_1;
};
function IntProgressionIterator(first, last, step) {
  IntIterator.call(this);
  this.w7_1 = step;
  this.x7_1 = last;
  this.y7_1 = this.w7_1 > 0 ? first <= last : first >= last;
  this.z7_1 = this.y7_1 ? first : this.x7_1;
}
protoOf(IntProgressionIterator).k = function () {
  return this.y7_1;
};
protoOf(IntProgressionIterator).l7 = function () {
  var value = this.z7_1;
  if (value === this.x7_1) {
    if (!this.y7_1)
      throw NoSuchElementException_init_$Create$();
    this.y7_1 = false;
  } else {
    this.z7_1 = this.z7_1 + this.w7_1 | 0;
  }
  return value;
};
function Companion_8() {
}
protoOf(Companion_8).r = function (rangeStart, rangeEnd, step) {
  return new IntProgression(rangeStart, rangeEnd, step);
};
var Companion_instance_8;
function Companion_getInstance_8() {
  return Companion_instance_8;
}
function IntProgression(start, endInclusive, step) {
  if (step === 0)
    throw IllegalArgumentException_init_$Create$_0('Step must be non-zero.');
  if (step === -2147483648)
    throw IllegalArgumentException_init_$Create$_0('Step must be greater than Int.MIN_VALUE to avoid overflow on negation.');
  this.s7_1 = start;
  this.t7_1 = getProgressionLastElement(start, endInclusive, step);
  this.u7_1 = step;
}
protoOf(IntProgression).j = function () {
  return new IntProgressionIterator(this.s7_1, this.t7_1, this.u7_1);
};
protoOf(IntProgression).m = function () {
  return this.u7_1 > 0 ? this.s7_1 > this.t7_1 : this.s7_1 < this.t7_1;
};
protoOf(IntProgression).equals = function (other) {
  var tmp;
  if (other instanceof IntProgression) {
    tmp = this.m() && other.m() || (this.s7_1 === other.s7_1 && this.t7_1 === other.t7_1 && this.u7_1 === other.u7_1);
  } else {
    tmp = false;
  }
  return tmp;
};
protoOf(IntProgression).hashCode = function () {
  return this.m() ? -1 : imul_0(31, imul_0(31, this.s7_1) + this.t7_1 | 0) + this.u7_1 | 0;
};
protoOf(IntProgression).toString = function () {
  return this.u7_1 > 0 ? '' + this.s7_1 + '..' + this.t7_1 + ' step ' + this.u7_1 : '' + this.s7_1 + ' downTo ' + this.t7_1 + ' step ' + (-this.u7_1 | 0);
};
function appendElement(_this__u8e3s4, element, transform) {
  if (!(transform == null))
    _this__u8e3s4.i(transform(element));
  else {
    if (element == null ? true : isCharSequence(element))
      _this__u8e3s4.i(element);
    else {
      if (element instanceof Char)
        _this__u8e3s4.s5(element.a8_1);
      else {
        _this__u8e3s4.i(toString_1(element));
      }
    }
  }
}
function equals_0(_this__u8e3s4, other, ignoreCase) {
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  if (_this__u8e3s4 === other)
    return true;
  if (!ignoreCase)
    return false;
  var thisUpper = uppercaseChar(_this__u8e3s4);
  var otherUpper = uppercaseChar(other);
  var tmp;
  if (thisUpper === otherUpper) {
    tmp = true;
  } else {
    // Inline function 'kotlin.text.lowercaseChar' call
    // Inline function 'kotlin.text.lowercase' call
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    var tmp$ret$2 = toString(thisUpper).toLowerCase();
    var tmp_0 = charCodeAt(tmp$ret$2, 0);
    // Inline function 'kotlin.text.lowercaseChar' call
    // Inline function 'kotlin.text.lowercase' call
    // Inline function 'kotlin.js.asDynamic' call
    // Inline function 'kotlin.js.unsafeCast' call
    var tmp$ret$6 = toString(otherUpper).toLowerCase();
    tmp = tmp_0 === charCodeAt(tmp$ret$6, 0);
  }
  return tmp;
}
function toIntOrNull(_this__u8e3s4) {
  return toIntOrNull_0(_this__u8e3s4, 10);
}
function toIntOrNull_0(_this__u8e3s4, radix) {
  checkRadix(radix);
  var length = _this__u8e3s4.length;
  if (length === 0)
    return null;
  var start;
  var isNegative;
  var limit;
  var firstChar = charCodeAt(_this__u8e3s4, 0);
  if (Char__compareTo_impl_ypi4mb(firstChar, _Char___init__impl__6a9atx(48)) < 0) {
    if (length === 1)
      return null;
    start = 1;
    if (firstChar === _Char___init__impl__6a9atx(45)) {
      isNegative = true;
      limit = -2147483648;
    } else if (firstChar === _Char___init__impl__6a9atx(43)) {
      isNegative = false;
      limit = -2147483647;
    } else
      return null;
  } else {
    start = 0;
    isNegative = false;
    limit = -2147483647;
  }
  var limitForMaxRadix = -59652323;
  var limitBeforeMul = limitForMaxRadix;
  var result = 0;
  var inductionVariable = start;
  if (inductionVariable < length)
    do {
      var i = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      var digit = digitOf(charCodeAt(_this__u8e3s4, i), radix);
      if (digit < 0)
        return null;
      if (result < limitBeforeMul) {
        if (limitBeforeMul === limitForMaxRadix) {
          limitBeforeMul = limit / radix | 0;
          if (result < limitBeforeMul) {
            return null;
          }
        } else {
          return null;
        }
      }
      result = imul_0(result, radix);
      if (result < (limit + digit | 0))
        return null;
      result = result - digit | 0;
    }
     while (inductionVariable < length);
  return isNegative ? result : -result | 0;
}
function numberFormatError(input) {
  throw NumberFormatException_init_$Create$_0("Invalid number format: '" + input + "'");
}
function split(_this__u8e3s4, delimiters, ignoreCase, limit) {
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  limit = limit === VOID ? 0 : limit;
  if (delimiters.length === 1) {
    var delimiter = delimiters[0];
    // Inline function 'kotlin.text.isEmpty' call
    if (!(charSequenceLength(delimiter) === 0)) {
      return split_0(_this__u8e3s4, delimiter, ignoreCase, limit);
    }
  }
  // Inline function 'kotlin.collections.map' call
  var this_0 = asIterable(rangesDelimitedBy(_this__u8e3s4, delimiters, VOID, ignoreCase, limit));
  // Inline function 'kotlin.collections.mapTo' call
  var destination = ArrayList_init_$Create$_0(collectionSizeOrDefault(this_0, 10));
  var _iterator__ex2g4s = this_0.j();
  while (_iterator__ex2g4s.k()) {
    var item = _iterator__ex2g4s.l();
    var tmp$ret$1 = substring_1(_this__u8e3s4, item);
    destination.h(tmp$ret$1);
  }
  return destination;
}
function split_0(_this__u8e3s4, delimiter, ignoreCase, limit) {
  requireNonNegativeLimit(limit);
  var currentOffset = 0;
  var nextIndex = indexOf_0(_this__u8e3s4, delimiter, currentOffset, ignoreCase);
  if (nextIndex === -1 || limit === 1) {
    return listOf(toString_1(_this__u8e3s4));
  }
  var isLimited = limit > 0;
  var result = ArrayList_init_$Create$_0(isLimited ? coerceAtMost(limit, 10) : 10);
  $l$loop: do {
    var tmp2 = currentOffset;
    // Inline function 'kotlin.text.substring' call
    var endIndex = nextIndex;
    var tmp$ret$0 = toString_1(charSequenceSubSequence(_this__u8e3s4, tmp2, endIndex));
    result.h(tmp$ret$0);
    currentOffset = nextIndex + delimiter.length | 0;
    if (isLimited && result.o() === (limit - 1 | 0))
      break $l$loop;
    nextIndex = indexOf_0(_this__u8e3s4, delimiter, currentOffset, ignoreCase);
  }
   while (!(nextIndex === -1));
  var tmp2_0 = currentOffset;
  // Inline function 'kotlin.text.substring' call
  var endIndex_0 = charSequenceLength(_this__u8e3s4);
  var tmp$ret$1 = toString_1(charSequenceSubSequence(_this__u8e3s4, tmp2_0, endIndex_0));
  result.h(tmp$ret$1);
  return result;
}
function rangesDelimitedBy(_this__u8e3s4, delimiters, startIndex, ignoreCase, limit) {
  startIndex = startIndex === VOID ? 0 : startIndex;
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  limit = limit === VOID ? 0 : limit;
  requireNonNegativeLimit(limit);
  var delimitersList = asList(delimiters);
  return new DelimitedRangesSequence(_this__u8e3s4, startIndex, limit, rangesDelimitedBy$lambda(delimitersList, ignoreCase));
}
function substring_1(_this__u8e3s4, range) {
  return toString_1(charSequenceSubSequence(_this__u8e3s4, range.r7(), range.v7() + 1 | 0));
}
function requireNonNegativeLimit(limit) {
  // Inline function 'kotlin.require' call
  if (!(limit >= 0)) {
    var message = 'Limit must be non-negative, but was ' + limit;
    throw IllegalArgumentException_init_$Create$_0(toString_1(message));
  }
  return Unit_instance;
}
function indexOf_0(_this__u8e3s4, string, startIndex, ignoreCase) {
  startIndex = startIndex === VOID ? 0 : startIndex;
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  var tmp;
  var tmp_0;
  if (ignoreCase) {
    tmp_0 = true;
  } else {
    tmp_0 = !(typeof _this__u8e3s4 === 'string');
  }
  if (tmp_0) {
    tmp = indexOf_1(_this__u8e3s4, string, startIndex, charSequenceLength(_this__u8e3s4), ignoreCase);
  } else {
    // Inline function 'kotlin.text.nativeIndexOf' call
    // Inline function 'kotlin.js.asDynamic' call
    tmp = _this__u8e3s4.indexOf(string, startIndex);
  }
  return tmp;
}
function calcNext($this) {
  if ($this.d8_1 < 0) {
    $this.b8_1 = 0;
    $this.e8_1 = null;
  } else {
    var tmp;
    var tmp_0;
    if ($this.g8_1.j8_1 > 0) {
      $this.f8_1 = $this.f8_1 + 1 | 0;
      tmp_0 = $this.f8_1 >= $this.g8_1.j8_1;
    } else {
      tmp_0 = false;
    }
    if (tmp_0) {
      tmp = true;
    } else {
      tmp = $this.d8_1 > charSequenceLength($this.g8_1.h8_1);
    }
    if (tmp) {
      $this.e8_1 = numberRangeToNumber($this.c8_1, get_lastIndex_1($this.g8_1.h8_1));
      $this.d8_1 = -1;
    } else {
      var match = $this.g8_1.k8_1($this.g8_1.h8_1, $this.d8_1);
      if (match == null) {
        $this.e8_1 = numberRangeToNumber($this.c8_1, get_lastIndex_1($this.g8_1.h8_1));
        $this.d8_1 = -1;
      } else {
        var index = match.a7();
        var length = match.b7();
        $this.e8_1 = until($this.c8_1, index);
        $this.c8_1 = index + length | 0;
        $this.d8_1 = $this.c8_1 + (length === 0 ? 1 : 0) | 0;
      }
    }
    $this.b8_1 = 1;
  }
}
function DelimitedRangesSequence$iterator$1(this$0) {
  this.g8_1 = this$0;
  this.b8_1 = -1;
  this.c8_1 = coerceIn(this$0.i8_1, 0, charSequenceLength(this$0.h8_1));
  this.d8_1 = this.c8_1;
  this.e8_1 = null;
  this.f8_1 = 0;
}
protoOf(DelimitedRangesSequence$iterator$1).l = function () {
  if (this.b8_1 === -1) {
    calcNext(this);
  }
  if (this.b8_1 === 0)
    throw NoSuchElementException_init_$Create$();
  var tmp = this.e8_1;
  var result = tmp instanceof IntRange ? tmp : THROW_CCE();
  this.e8_1 = null;
  this.b8_1 = -1;
  return result;
};
protoOf(DelimitedRangesSequence$iterator$1).k = function () {
  if (this.b8_1 === -1) {
    calcNext(this);
  }
  return this.b8_1 === 1;
};
function DelimitedRangesSequence(input, startIndex, limit, getNextMatch) {
  this.h8_1 = input;
  this.i8_1 = startIndex;
  this.j8_1 = limit;
  this.k8_1 = getNextMatch;
}
protoOf(DelimitedRangesSequence).j = function () {
  return new DelimitedRangesSequence$iterator$1(this);
};
function findAnyOf(_this__u8e3s4, strings, startIndex, ignoreCase, last) {
  if (!ignoreCase && strings.o() === 1) {
    var string = single(strings);
    var index = !last ? indexOf_0(_this__u8e3s4, string, startIndex) : lastIndexOf_0(_this__u8e3s4, string, startIndex);
    return index < 0 ? null : to(index, string);
  }
  var indices = !last ? numberRangeToNumber(coerceAtLeast(startIndex, 0), charSequenceLength(_this__u8e3s4)) : downTo(coerceAtMost(startIndex, get_lastIndex_1(_this__u8e3s4)), 0);
  if (typeof _this__u8e3s4 === 'string') {
    var inductionVariable = indices.s7_1;
    var last_0 = indices.t7_1;
    var step = indices.u7_1;
    if (step > 0 && inductionVariable <= last_0 || (step < 0 && last_0 <= inductionVariable))
      do {
        var index_0 = inductionVariable;
        inductionVariable = inductionVariable + step | 0;
        var tmp$ret$1;
        $l$block: {
          // Inline function 'kotlin.collections.firstOrNull' call
          var _iterator__ex2g4s = strings.j();
          while (_iterator__ex2g4s.k()) {
            var element = _iterator__ex2g4s.l();
            if (regionMatches(element, 0, _this__u8e3s4, index_0, element.length, ignoreCase)) {
              tmp$ret$1 = element;
              break $l$block;
            }
          }
          tmp$ret$1 = null;
        }
        var matchingString = tmp$ret$1;
        if (!(matchingString == null))
          return to(index_0, matchingString);
      }
       while (!(index_0 === last_0));
  } else {
    var inductionVariable_0 = indices.s7_1;
    var last_1 = indices.t7_1;
    var step_0 = indices.u7_1;
    if (step_0 > 0 && inductionVariable_0 <= last_1 || (step_0 < 0 && last_1 <= inductionVariable_0))
      do {
        var index_1 = inductionVariable_0;
        inductionVariable_0 = inductionVariable_0 + step_0 | 0;
        var tmp$ret$3;
        $l$block_0: {
          // Inline function 'kotlin.collections.firstOrNull' call
          var _iterator__ex2g4s_0 = strings.j();
          while (_iterator__ex2g4s_0.k()) {
            var element_0 = _iterator__ex2g4s_0.l();
            if (regionMatchesImpl(element_0, 0, _this__u8e3s4, index_1, element_0.length, ignoreCase)) {
              tmp$ret$3 = element_0;
              break $l$block_0;
            }
          }
          tmp$ret$3 = null;
        }
        var matchingString_0 = tmp$ret$3;
        if (!(matchingString_0 == null))
          return to(index_1, matchingString_0);
      }
       while (!(index_1 === last_1));
  }
  return null;
}
function indexOf_1(_this__u8e3s4, other, startIndex, endIndex, ignoreCase, last) {
  last = last === VOID ? false : last;
  var indices = !last ? numberRangeToNumber(coerceAtLeast(startIndex, 0), coerceAtMost(endIndex, charSequenceLength(_this__u8e3s4))) : downTo(coerceAtMost(startIndex, get_lastIndex_1(_this__u8e3s4)), coerceAtLeast(endIndex, 0));
  var tmp;
  if (typeof _this__u8e3s4 === 'string') {
    tmp = typeof other === 'string';
  } else {
    tmp = false;
  }
  if (tmp) {
    var inductionVariable = indices.s7_1;
    var last_0 = indices.t7_1;
    var step = indices.u7_1;
    if (step > 0 && inductionVariable <= last_0 || (step < 0 && last_0 <= inductionVariable))
      do {
        var index = inductionVariable;
        inductionVariable = inductionVariable + step | 0;
        if (regionMatches(other, 0, _this__u8e3s4, index, other.length, ignoreCase))
          return index;
      }
       while (!(index === last_0));
  } else {
    var inductionVariable_0 = indices.s7_1;
    var last_1 = indices.t7_1;
    var step_0 = indices.u7_1;
    if (step_0 > 0 && inductionVariable_0 <= last_1 || (step_0 < 0 && last_1 <= inductionVariable_0))
      do {
        var index_0 = inductionVariable_0;
        inductionVariable_0 = inductionVariable_0 + step_0 | 0;
        if (regionMatchesImpl(other, 0, _this__u8e3s4, index_0, charSequenceLength(other), ignoreCase))
          return index_0;
      }
       while (!(index_0 === last_1));
  }
  return -1;
}
function get_lastIndex_1(_this__u8e3s4) {
  return charSequenceLength(_this__u8e3s4) - 1 | 0;
}
function lastIndexOf_0(_this__u8e3s4, string, startIndex, ignoreCase) {
  startIndex = startIndex === VOID ? get_lastIndex_1(_this__u8e3s4) : startIndex;
  ignoreCase = ignoreCase === VOID ? false : ignoreCase;
  var tmp;
  var tmp_0;
  if (ignoreCase) {
    tmp_0 = true;
  } else {
    tmp_0 = !(typeof _this__u8e3s4 === 'string');
  }
  if (tmp_0) {
    tmp = indexOf_1(_this__u8e3s4, string, startIndex, 0, ignoreCase, true);
  } else {
    // Inline function 'kotlin.text.nativeLastIndexOf' call
    // Inline function 'kotlin.js.asDynamic' call
    tmp = _this__u8e3s4.lastIndexOf(string, startIndex);
  }
  return tmp;
}
function regionMatchesImpl(_this__u8e3s4, thisOffset, other, otherOffset, length, ignoreCase) {
  if (otherOffset < 0 || thisOffset < 0 || thisOffset > (charSequenceLength(_this__u8e3s4) - length | 0) || otherOffset > (charSequenceLength(other) - length | 0)) {
    return false;
  }
  var inductionVariable = 0;
  if (inductionVariable < length)
    do {
      var index = inductionVariable;
      inductionVariable = inductionVariable + 1 | 0;
      if (!equals_0(charSequenceGet(_this__u8e3s4, thisOffset + index | 0), charSequenceGet(other, otherOffset + index | 0), ignoreCase))
        return false;
    }
     while (inductionVariable < length);
  return true;
}
function rangesDelimitedBy$lambda($delimitersList, $ignoreCase) {
  return function ($this$DelimitedRangesSequence, currentIndex) {
    var tmp0_safe_receiver = findAnyOf($this$DelimitedRangesSequence, $delimitersList, currentIndex, $ignoreCase, false);
    var tmp;
    if (tmp0_safe_receiver == null) {
      tmp = null;
    } else {
      // Inline function 'kotlin.let' call
      tmp = to(tmp0_safe_receiver.g7_1, tmp0_safe_receiver.h7_1.length);
    }
    return tmp;
  };
}
function Pair(first, second) {
  this.g7_1 = first;
  this.h7_1 = second;
}
protoOf(Pair).toString = function () {
  return '(' + toString_0(this.g7_1) + ', ' + toString_0(this.h7_1) + ')';
};
protoOf(Pair).a7 = function () {
  return this.g7_1;
};
protoOf(Pair).b7 = function () {
  return this.h7_1;
};
protoOf(Pair).hashCode = function () {
  var result = this.g7_1 == null ? 0 : hashCode(this.g7_1);
  result = imul_0(result, 31) + (this.h7_1 == null ? 0 : hashCode(this.h7_1)) | 0;
  return result;
};
protoOf(Pair).equals = function (other) {
  if (this === other)
    return true;
  if (!(other instanceof Pair))
    return false;
  var tmp0_other_with_cast = other instanceof Pair ? other : THROW_CCE();
  if (!equals(this.g7_1, tmp0_other_with_cast.g7_1))
    return false;
  if (!equals(this.h7_1, tmp0_other_with_cast.h7_1))
    return false;
  return true;
};
function to(_this__u8e3s4, that) {
  return new Pair(_this__u8e3s4, that);
}
//region block: post-declaration
protoOf(AbstractMutableList).asJsReadonlyArrayView = asJsReadonlyArrayView;
protoOf(InternalHashMap).c4 = containsAllEntries;
protoOf(EmptyList).asJsReadonlyArrayView = asJsReadonlyArrayView;
//endregion
//region block: init
Companion_instance = new Companion();
Unit_instance = new Unit();
_stableSortingIsSupported = null;
Companion_instance_2 = new Companion_2();
Companion_instance_3 = new Companion_3();
Companion_instance_4 = new Companion_4();
Companion_instance_5 = new Companion_5();
EmptyIterator_instance = new EmptyIterator();
NaturalOrderComparator_instance = new NaturalOrderComparator();
Companion_instance_8 = new Companion_8();
//endregion
//region block: exports
var KtList = {getInstance: Companion_getInstance};
export {
  KtList as KtList,
};
export {
  VOID as VOID3gxj6tk5isa35,
  ArrayDeque_init_$Create$ as ArrayDeque_init_$Create$2333dl090ltjt,
  ArrayList_init_$Create$_0 as ArrayList_init_$Create$3bxttkj3v1mea,
  ArrayList_init_$Create$ as ArrayList_init_$Create$149jv2ovkkvnt,
  LinkedHashMap_init_$Create$_0 as LinkedHashMap_init_$Create$23uxki4opd0pn,
  IllegalArgumentException_init_$Create$_0 as IllegalArgumentException_init_$Create$3ewkh27kzt8z8,
  NoSuchElementException_init_$Create$ as NoSuchElementException_init_$Create$keivgb96udi6,
  NoSuchElementException_init_$Create$_0 as NoSuchElementException_init_$Create$4w03vct39ryy,
  UnsupportedOperationException_init_$Create$_0 as UnsupportedOperationException_init_$Create$1pe732c4s59hc,
  _Char___init__impl__6a9atx as _Char___init__impl__6a9atx2js6krycynjoo,
  Unit_instance as Unit_instance1fbcbse1fwigr,
  Collection as Collection1k04j3hzsbod0,
  addAll as addAll1k27qatfgp3k5,
  arrayCopy as arrayCopytctsywo3h7gj,
  checkIndexOverflow as checkIndexOverflow3frtmheghr0th,
  collectionSizeOrDefault as collectionSizeOrDefault36dulx8yinfqm,
  contains as contains1tccixv8iwdcq,
  copyToArray as copyToArray2j022khrow2yi,
  distinct as distinct10qe1scfdvu5k,
  emptyList as emptyList1g2z5xcrvp2zy,
  firstOrNull as firstOrNull1gk7vzkf4h3nq,
  getOrNull as getOrNull1d60i0672n7ns,
  getOrNull_0 as getOrNull1go7ef9ldk0df,
  getValue as getValue48kllevslyh6,
  joinToString_0 as joinToString1cxrrlmo0chqs,
  get_lastIndex as get_lastIndexx0qsydpfv3mu,
  last as last1vo29oleiqj36,
  listOf as listOfvhqybd2zx248,
  listOf_0 as listOf1jh22dvmctj1r,
  mapCapacity as mapCapacity1h45rc3eh9p2l,
  mapOf as mapOf1xd03cq9cnmy8,
  max as maxwcemc4giadkb,
  max_0 as max2o8z1isrnjymo,
  min as miny9ry5d0y0n2x,
  min_0 as minjeab1ybpajdx,
  mutableListOf as mutableListOf6oorvk2mtdmp,
  plus_1 as plus27p1csfyhycs6,
  plus as plus310ted5e4i90h,
  plus_0 as plus20p0vtfmu0596,
  setOf_0 as setOf45ia9pnfhe90,
  sortedWith as sortedWith2csnbbb21k0lg,
  sorted as sortedvxq8id1oldjy,
  sorted_0 as sorted354mfsiv4s7x5,
  sort_0 as sort15ai02l4kxbfa,
  sum as sum2ku6kbgxq0lee,
  takeLast as takeLast2px6eo6glugs7,
  toList_0 as toList2z3tifmtru5ra,
  toList as toList383f556t1dixk,
  toSet_0 as toSet2orjxp16sotqu,
  withIndex as withIndex3s8q7w1g0hyfn,
  compareValues as compareValues1n2ayl87ihzfk,
  FunctionAdapter as FunctionAdapter3lcrrz3moet5b,
  charSequenceGet as charSequenceGet1vxk1y5n17t1z,
  charSequenceLength as charSequenceLength3278n89t01tmv,
  defineProp as defineProp3hxgpk2knu2px,
  equals as equals2au1ep9vhcato,
  getNumberHashCode as getNumberHashCode2l4nbdcihl25f,
  hashCode as hashCodeq5arwsb9dgti,
  initMetadataForClass as initMetadataForClassbxx6q50dy2s7,
  initMetadataForCompanion as initMetadataForCompanion1wyw17z38v6ac,
  initMetadataForObject as initMetadataForObject1cxne3s9w65el,
  isInterface as isInterface3d6p8outrmvmk,
  numberToInt as numberToInt1ygmcfwhs2fkq,
  protoOf as protoOf180f3jzyo7rfj,
  toLong as toLongw1zpgk99d84b,
  toString_1 as toString1pkumu07cwy4m,
  abs as abs1kdzbjes1idip,
  roundToInt as roundToInt1ue8x8yshtznx,
  round as round2mrvepag8eey0,
  coerceAtLeast as coerceAtLeast2bkz8m9ik7hep,
  coerceIn_0 as coerceIn1xblvmyr0tby6,
  coerceIn_1 as coerceInlzh524ulyz3c,
  coerceIn as coerceIn10f36k81le1mm,
  split as split2bvyvnrlcifjv,
  takeLast_0 as takeLast2r8kr8e6g6hi7,
  toIntOrNull as toIntOrNull3w2d066r9pvwm,
  toInt as toInt2q8uldh7sc951,
  Comparator as Comparator2b3maoeh98xtg,
  Long as Long2qws0ah9gnpki,
  THROW_CCE as THROW_CCE2g6jy02ryeudk,
  ensureNotNull as ensureNotNull1e947j3ixpazm,
  isFinite as isFinite2t9l5a275mxm6,
  isNaN_0 as isNaNymqb93xtq8w8,
  to as to2cs3ny02qtbcb,
};
//endregion


