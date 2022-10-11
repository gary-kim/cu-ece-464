### Part 1

#### Problem 1

Query: `SELECT boats.bid,boats.bname,COUNT(*) as 'Reserve Count' FROM boats JOIN reserves ON boats.bid = reserves.bid GROUP BY reserves.bid;`

```
+-----+-----------+---------------+
| bid | bname     | Reserve Count |
+-----+-----------+---------------+
| 101 | Interlake |             2 |
| 102 | Interlake |             3 |
| 103 | Clipper   |             3 |
| 104 | Clipper   |             5 |
| 105 | Marine    |             3 |
| 106 | Marine    |             3 |
| 109 | Driftwood |             4 |
| 112 | Sooney    |             1 |
| 110 | Klapser   |             3 |
| 107 | Marine    |             1 |
| 111 | Sooney    |             1 |
| 108 | Driftwood |             1 |
+-----+-----------+---------------+
12 rows in set (0.00 sec)
```

#### Problem 2

The wording on this problem opens up two possibilities so I have put both.

In the case that it means list sailors who have reserved any red boat, the following query works:

Query: `SELECT sid,sname FROM sailors WHERE sid IN (SELECT sid FROM reserves WHERE reserves.bid IN (SELECT bid from boats WHERE color = 'red'));`

```
+-----+----------+
| sid | sname    |
+-----+----------+
|  22 | dusting  |
|  23 | emilio   |
|  24 | scruntus |
|  31 | lubber   |
|  35 | figaro   |
|  59 | stum     |
|  61 | ossola   |
|  62 | shaun    |
|  64 | horatio  |
|  88 | dan      |
|  89 | dye      |
+-----+----------+
11 rows in set (0.01 sec)
```

In the case that it means list sailors who have reserved **every sinle** red boat, the following query works:

Query: `SELECT sid,sname FROM sailors as s WHERE (SELECT COUNT(DISTINCT boats.bid) as count FROM reserves JOIN boats on reserves.bid = boats.bid WHERE sid = s.sid) = (SELECT COUNT(*) FROM boats WHERE color = 'red');`

```
Empty set (0.00 sec)
```

#### Problem 3

Query: `SELECT sid,sname FROM sailors WHERE sid NOT IN (SELECT sid FROM reserves WHERE reserves.bid IN (SELECT bid from boats WHERE color != 'red')) AND sid IN (SELECT sid FROM reserves);`

```
+-----+----------+
| sid | sname    |
+-----+----------+
|  23 | emilio   |
|  24 | scruntus |
|  35 | figaro   |
|  61 | ossola   |
|  62 | shaun    |
+-----+----------+
5 rows in set (0.00 sec)
```

#### Problem 4

Query: `SELECT boats.*,COUNT(*) as Reservations FROM reserves JOIN boats ON boats.bid = reserves.bid GROUP BY boats.bid ORDER BY Reservations DESC LIMIT 1;`

```
+-----+---------+-------+--------+--------------+
| bid | bname   | color | length | Reservations |
+-----+---------+-------+--------+--------------+
| 104 | Clipper | red   |     40 |            5 |
+-----+---------+-------+--------+--------------+
1 row in set (0.00 sec)
```

#### Problem 5

Query: `SELECT sid,sname FROM sailors WHERE sid NOT IN (SELECT sid FROM reserves WHERE reserves.bid IN (SELECT bid from boats WHERE color = 'red'));`

```
+-----+---------+
| sid | sname   |
+-----+---------+
|  29 | brutus  |
|  32 | andy    |
|  58 | rusty   |
|  60 | jit     |
|  71 | zorba   |
|  74 | horatio |
|  85 | art     |
|  90 | vin     |
|  95 | bob     |
+-----+---------+
9 rows in set (0.00 sec)
```

#### Problem 6

Query: `SELECT AVG(age) AS Average FROM sailors WHERE rating = 10;`

```
+---------+
| Average |
+---------+
| 35.0000 |
+---------+
1 row in set (0.00 sec)
```

#### Problem 7

Query: `SELECT rating,sname,sid FROM sailors WHERE sid IN(SELECT (SELECT sid FROM sailors AS i where i.rating = o.rating ORDER BY i.age LIMIT 1) AS sid FROM sailors AS o GROUP BY rating ORDER BY rating) ORDER BY rating;`

```
+--------+----------+-----+
| rating | sname    | sid |
+--------+----------+-----+
|      1 | scruntus |  24 |
|      3 | art      |  85 |
|      7 | horatio  |  64 |
|      8 | stum     |  59 |
|      9 | horatio  |  74 |
|     10 | rusty    |  58 |
+--------+----------+-----+
6 rows in set (0.00 sec)
```

#### Problem 8

Query: `SELECT *,(SELECT sid as count FROM reserves AS r WHERE r.bid = b.bid GROUP BY sid ORDER BY COUNT(*) DESC LIMIT 1) AS sailor_id, (SELECT sname FROM sailors AS s WHERE s.sid = sailor_id LIMIT 1) AS sname FROM boats AS b;`

```
+------+-----------+-------+--------+-----------+----------+
| bid  | bname     | color | length | sailor_id | sname    |
+------+-----------+-------+--------+-----------+----------+
|  101 | Interlake | blue  |     45 |        22 | dusting  |
|  102 | Interlake | red   |     45 |        22 | dusting  |
|  103 | Clipper   | green |     40 |        22 | dusting  |
|  104 | Clipper   | red   |     40 |        24 | scruntus |
|  105 | Marine    | red   |     35 |        23 | emilio   |
|  106 | Marine    | green |     35 |        60 | jit      |
|  107 | Marine    | blue  |     35 |        88 | dan      |
|  108 | Driftwood | red   |     35 |        89 | dye      |
|  109 | Driftwood | blue  |     35 |        89 | dye      |
|  110 | Klapser   | red   |     30 |        88 | dan      |
|  111 | Sooney    | green |     28 |        88 | dan      |
|  112 | Sooney    | red   |     28 |        61 | ossola   |
+------+-----------+-------+--------+-----------+----------+
12 rows in set (0.00 sec)
```

### Part 2

See included project in <./orm> directory.


### Part 3

As more and more sailors start coming to the business, it becomes more and more important to keep contact information for every sailor and records about what their boating licenses. This is a rather simple addition of adding two new tables with foreign keys to connect to the sailor table but the basic framework this sets up is very useful for many of the record keeping requirements of larger organizations.

Implemented in <./orm/index.js> and <./orm/db.js>.

