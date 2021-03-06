(function() {
  if (typeof getToolTest === 'undefined') {
    load('jstests/configs/plain_28.config.js');
  }
  var expectedDocs = [{
    a: "foo",
    b: 12,
    c: {
      xyz: ISODate("1997-06-02T15:24:00Z"),
      noop: true,
    },
    d: {hij: {lkm: BinData(0, "e8MEnzZoFyMmD7WSHdNrFJyEk8M=")}},
  }, {
    a: "bar",
    b: 24,
    c: {
      xyz: "06/08/2016 09:26:00",
      noop: true,
    },
    d: {hij: {lkm: BinData(0, "dGVzdAo=")}},
  }, {
    a: "baz",
    b: 36,
    c: {
      xyz: ISODate("2016-06-08T09:26:00Z"),
      noop: false,
    },
    d: {hij: {lkm: BinData(0, "dGVzdAo=")}},
  }];
  jsTest.log('Testing parseGrace option');

  var checkCollectionContents = function(coll) {
    var importedDoc = coll.findOne({a: "foo"});
    delete importedDoc["_id"];
    assert.docEq(importedDoc, expectedDocs[0]);
    importedDoc = coll.findOne({a: "baz"});
    delete importedDoc["_id"];
    assert.docEq(importedDoc, expectedDocs[2]);
  };

  var reset = function(coll) {
    coll.drop();
    assert.eq(coll.count(), 0);
  };

  var toolTest = getToolTest("import_fields");
  var db1 = toolTest.db;
  var commonToolArgs= getCommonToolArguments();

  var c = db1.c.getDB().getSiblingDB("testdb")["testcoll"];

  // parseGrace=fail should cause a failure
  var ret = toolTest.runTool.apply(toolTest, ["import", "--file",
    "jstests/import/testdata/parse_grace.csv",
    "--type", "csv",
    "--db", "testdb",
    "--collection", "testcoll",
    "--columnsHaveTypes",
    "--parseGrace", "stop",
    "--headerline"]
    .concat(commonToolArgs));
  assert.neq(ret, 0);
  reset(c);

  // parseGrace=skipRow should not import the row
  // with an un-coercable field
  ret = toolTest.runTool.apply(toolTest, ["import", "--file",
    "jstests/import/testdata/parse_grace.csv",
    "--type", "csv",
    "--db", "testdb",
    "--collection", "testcoll",
    "--columnsHaveTypes",
    "--parseGrace", "skipRow",
    "--headerline"]
    .concat(commonToolArgs));
  checkCollectionContents(c);
  assert.eq(c.count(), 2);
  reset(c);

  // parseGrace=skipField should not import the
  // an un-coercable field, but still keep the rest
  // of the row
  ret = toolTest.runTool.apply(toolTest, ["import", "--file",
    "jstests/import/testdata/parse_grace.csv",
    "--type", "csv",
    "--db", "testdb",
    "--collection", "testcoll",
    "--columnsHaveTypes",
    "--parseGrace", "skipField",
    "--headerline"]
    .concat(commonToolArgs));
  checkCollectionContents(c);
  assert.eq(c.count(), 3);
  assert.neq(c.findOne({a: "bar"}), null);
  assert.eq(c.findOne({a: "bar"}).c.xyz, undefined);
  reset(c);

  // parseGrace=autoCast should import the un-coercable field
  ret = toolTest.runTool.apply(toolTest, ["import", "--file",
    "jstests/import/testdata/parse_grace.csv",
    "--type", "csv",
    "--db", "testdb",
    "--collection", "testcoll",
    "--columnsHaveTypes",
    "--parseGrace", "autoCast",
    "--headerline"]
    .concat(commonToolArgs));
  checkCollectionContents(c);
  assert.eq(c.count(), 3);
  var importedDoc = c.findOne({a: "bar"});
  delete importedDoc["_id"];
  assert.docEq(importedDoc, expectedDocs[1]);
  reset(c);

  toolTest.stop();
}());
