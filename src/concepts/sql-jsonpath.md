---
layout: body
eleventyNavigation:
    key: SQL JSONPath
    parent: Concepts
    order: 5
permalink: concepts/sql-jsonpath/
title: Concepts - SQL JSONPath
---

# SQL JSONPath for Filter Selectors
SQL JSONPath, defined in the SQL2016 specification, takes much of its design from Stefan Goessner’s [JSONPath](https://goessner.net/articles/JsonPath/index.html). Stefan’s goal was to create a JSON version of [XPath](https://developer.mozilla.org/en-US/docs/Web/XPath), an XML processing tool. SQL JSONPath has a smaller set of requirements mostly focused on finding and extracting data from JSON data columns.

Evently’s use case for JSONPath aligns with SQL databases, and the filter selector query language uses SQL JSONPath to find ledger events that match queries in their meta and data fields. Evently does not allow the editing of existing events so no data modification features are needed from earlier JSONPath syntaxes. 

### Expressions

SQL JSONPath expressions can match any form of JSON, including scalars, arrays and objects. The top level of a JSON structure starts with `$` and expressions progress their way down object properties and across arrays to reference fields and apply filtering query expressions.

Expressions have two sections; the navigation statement and a filter expression. The filter section is optional.

#### `<navigation> ? <filter?>`

Here is an example expression:

`$.book.authors[*] ? (@ == "Evelyn Waugh" || @ == "Herman Mellville")`

#### Navigation

Navigation can utilize dot notation, such as `$.book.authors[0]`

Navigation can also use bracket notation, such as `$["book"]["authors"][0]`

Bracket notation must use double quotes instead of single quotes.

| Navigation Operator       | Description                                                                                                                                                                |
|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `$`                       | The root element reference. May be an object, an array, or a scalar value                                                                                                  |
| `.<name>` or `["<name>"]` | Child reference                                                                                                                                                            |
| `*`                       | Wildcard references any child or array element                                                                                                                             |
| `[<pos>]`                 | Array element reference                                                                                                                                                    |
| `[<pos>, <pos>]`          | Comma-separated list of array element references                                                                                                                           |
| `[<pos> to <pos>]`        | Array element range reference. Can be used as `<pos>` in list of element references.                                                                                       |
| `[last]`, `[last-1]`      | Last variable refers to the last element in the array and can be used as `<pos>` in list of element references. Value can be modified with the subtraction (`-`) operator. |

At the completion of navigation, the values are represented as the `@` character in the filter section.

#### Filter

Filtering expressions come after the navigation expression. The two are separated by the `?` character. Filtering expressions look like javascript value tests, and one can use the `@` symbol as a reference to the navigation value, or values if the navigation lands on an array. In the case of an array, each value of the array is tested against the filter statement.

Predicates must be wrapped in parentheses `()` and internally combined with `&&` and `||` symbols. Their predicate result can be reversed with the `!` symbol. They utilize the `@` to reference the navigation value. For example:

`(@.name == "Marc Wu")`

| Predicate Operator | Description           |
|--------------------|-----------------------|
| `==`               | Equal                 |
| `!=`, `<>`         | Not Equal             |
| `>`                | Greater than          |
| `<`                | Less than             |
| `>=`               | Equal or greater than |
| `<=`               | Equal or less than    |

A predicate can transform the navigation data with arithmetic operators. These do not change the data directly, but can be used to modify the data to test in a filter expression.

- Unary: `+` and `-` change the sign of numeric values.
- Binary: `+`, `-`, `*`, `/` and `%` for addition, subtraction, multiplication, division and modulus.

Value functions offer ways to extract type information and apply mathematical functions before testing the value with predicate operators.

| Function                 | Description                                                                                                                                                                                                                                           |
|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `.type()`                | Returns `null`, `boolean`, `number`, `string`, `array`, `object` or `date`                                                                                                                                                                            |
| `.size()`                | If `@` references an array, then it returns the number of elements in the array                                                                                                                                                                       |
| `.double()`              | Converts a string to a numeric value                                                                                                                                                                                                                  |
| `.ceiling()`             | Round a numeric value up to the next largest integer                                                                                                                                                                                                  |
| `.floor()`               | Round a numeric value down to the next smallest integer                                                                                                                                                                                               |
| `.abs()`                 | The absolute value of a numeric value                                                                                                                                                                                                                 |
| `.datetime("template"?)` | Converts a string into a Date object. The optional `template` is a quoted template string. If omitted, the ISO-8601 pattern (built into Javascript) will be used to evaluate the string. The SQL JSONPath spec does not specify this template format. |
| `.keyvalue()`            | Converts an object into an array of name/value objects: `[{name, value}, ...]` which allows a predicate to extract the key name and value.                                                                                                            |

Datetime template formatting symbols only match numeric date-time values, as SQL JSONPath does not have a language or culture setting to parse words for month and day.

| Symbol | Meaning                                                                                |
|--------|----------------------------------------------------------------------------------------|
| `y`    | year                                                                                   |
| `M`    | month                                                                                  |
| `d`    | day of month                                                                           |
| `h`    | clock hour from 1 to 12; use `a` in template to capture AM/PM                          |
| `a`    | AM or PM                                                                               |
| `H`    | hour from 0 to 23                                                                      |
| `m`    | minute from 00 to 59                                                                   |
| `s`    | second from 00 to 59                                                                   |
| `S`    | millisecond                                                                            |
| `z`    | [Timezone abbreviation](https://en.wikipedia.org/wiki/List_of_time_zone_abbreviations) |

#### Predicate functions

A value can be tested for existence, and string values can be tested for prefixes and regular expression matches.

| Expression                                      | Description                                                                                                                 |
|-------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `exists ()`                                     | A value exists for the given predicate                                                                                      |
| `() is unknown`                                 | Predicate result cannot be determined; neither true nor false                                                               |
| `starts with "<text>"`                          | Value starts with specified text                                                                                            |
| `like_regex "regex-expression" flag? "<flags>"` | [XQuery](https://www.regular-expressions.info/xpath.html) regular expression. Have a look at [XRegexp](https://xregexp.com) |

Regex flags are optional, and change the pattern matching behavior.

* `i` case-insensitive mode.
* `s` single-line mode, or dot-all mode. Content, including newlines, is treated as a single line.
* `m` multi-line mode. `$` and `^` match newlines in the content in addition to the string as a whole.
* `x` free spacing mode. Whitespace in the regex pattern is ignored, so if your regex is declared across multiple lines, the whitespace is removed before evaluation. One would use whitespace to improve the readability of larger regex patterns in source code. Without this mode, whitespace in the regex would be matched in the content.

#### Named Variables
 
Statements can include named variables in place of data values. Conceptually similar to SQL value placeholders, they allow a statement text to be reused while the variables change with other calls. Named variables simplify the statements and improve their reusability in applications.

Named variables can be used in place of any data value. They begin with the `$`  character, followed by JavaScript-compatible variable naming conventions. Here is an example:

###### `(@.name == $fullName)`

In this example, `$fullName` contains different values at runtime. This statement string, however, does not need to change with each call. The application will send along the `fullName` value and Evently will interpret the condition based on the `fullName` value at that time.

###### `$[$key]`

`$` refers to an object. The named variable can be used as an object key name, or as an array index as well:

###### `$[$pos to last]` 

Returns the elements in an array referenced by `$` from `$pos` to the last element in the array.

Methods can be applied to named variables as well.

###### `$thing.type()` 

Provides `$thing`'s data type at runtime. Any function can be used on a named variable.

### Examples

This example is taken from Stefan Goessner’s original [JSONPath example](https://goessner.net/articles/JsonPath/index.html#e3). It has been modified to be a set of appended events in a `store` entity. The event could be called `sku-added` and records item type and type-specific details added to the store’s SKU list.

```json
// Event 1
{ "book": {
    "category": "reference",
    "authors": ["Nigel Rees"],
    "title": "Sayings of the Century",
    "price": 8.95
  }
}

// Event 2
{ "book": {
    "category": "fiction",
    "authors": ["Evelyn Waugh"],
    "title": "Sword of Honour",
    "price": 12.99
  }
}

// Event 3
{ "book": {
    "category": "fiction",
    "authors": ["Herman Melville"],
    "title": "Moby Dick",
    "isbn": "0-553-21311-3",
    "price": 8.99
  }
}

// Event 4
{ "book": {
    "category": "fiction",
    "authors": ["Stephen King", "Peter Straub"],
    "title": "The Talisman",
    "isbn": "0-375-50777-9",
    "price": 22.99
  }
}

// Event 5
{ "bicycle": {
    "color": "red",
    "price": 1995.95
  }
}
```

These event `data` objects can be filtered with the expressions in the table below. The expressions would be submitted as part of a [Filter Selector](/api/#operation/post-selector-filter-lookup) query:

```json
{
  "data": {
    "store": {
      "sku-added": "<JSONPath expression goes here>"
    }
  }
}
```

| JSONPath Expression                                  | Goal                                                                                                                                                                                                    | Event Count              |
|------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------|
| `$.book.authors ? (@ == "Herman Melville")`          | Events where book’s author is “Herman Melville”                                                                                                                                                         | 4                        |
| `$.book.authors ? (@.size() > 1)`                    | Book events with more than one author                                                                                                                                                                   | 1                        |
| `$.book`                                             | All book events                                                                                                                                                                                         | 4                        |
| `$ ? ((@.book.price > 10)                            |                                                                                                                                                                                                         | (@.bicycle.price > 10))` | All book and bicycle events where price is > 10                                                                                                                                                      | 3   |
| `$.book.authors[last] ? (@ == "Peter Straub")`       | Events where book’s last author is “Peter Straub”                                                                                                                                                       | 1                        |
| `$.book ? (exists(@.isbn))`                          | Events where books have an isbn                                                                                                                                                                         | 2                        |
| `$.book ? (!exists(@.isbn))`                         | Events where books do not have an isbn                                                                                                                                                                  | 2                        |
| `$.book.title ? (@ starts with "S")`                 | Events where book titles start with the letter “S”                                                                                                                                                      | 2                        |
| `$.book ? ((@.category > 100) is unknown)`           | Events where book’s category is > 100. Nonsensical in the example data, but in cases where the value has mixed types across multiple events, `is unknown` identifies predicates with `unknown` results. | 4                        |
| `$.bicycle ? (@.colour like_regex "^RED$" flag "i")` | Event’s where the bicycle’s colour is “red”, regardless of case                                                                                                                                         | 1                        |
