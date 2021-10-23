const test = require("ava");

const listIntro = require("./list-intros");

test("Message fields object (1,3 intro)", (t) => {
  const input = [
    {
      hash: "92553ef1e1e7f0fbc299ab64310cc492bc0b886b5cace2d0a6c207c18b8a8766",
      name: "tada",
    },
  ];
  const output = [{ name: "Intros", value: "▫ tada", inline: true }];

  t.deepEqual(output, listIntro.assembleFields(input));

  const input1 = [
    {
      hash: "",
      name: "1",
    },
    {
      hash: "",
      name: "2",
    },
    {
      hash: "",
      name: "3",
    },
  ];
  const output1 = [
    {
      name: "Intros",
      value: "▫ 1\n▫ 2\n▫ 3",
      inline: true,
    },
  ];

  t.deepEqual(output1, listIntro.assembleFields(input1));
});

test("Message fields object (10 intro)", (t) => {
  const input = [
    {
      hash: "",
      name: "1",
    },
    {
      hash: "",
      name: "2",
    },
    {
      hash: "",
      name: "3",
    },
    {
      hash: "",
      name: "4",
    },
    {
      hash: "",
      name: "5",
    },
    {
      hash: "",
      name: "6",
    },
    {
      hash: "",
      name: "7",
    },
    {
      hash: "",
      name: "8",
    },
    {
      hash: "",
      name: "9",
    },
    {
      hash: "",
      name: "10",
    },
  ];
  const output = [
    {
      name: "Intros",
      value: "▫ 1\n▫ 2\n▫ 3\n▫ 4\n▫ 5\n▫ 6\n▫ 7\n▫ 8\n▫ 9\n▫ 10",
      inline: true,
    },
  ];

  t.deepEqual(output, listIntro.assembleFields(input));
});

test("Message fields object (13 intro)", (t) => {
  const input = [
    {
      hash: "",
      name: "1",
    },
    {
      hash: "",
      name: "2",
    },
    {
      hash: "",
      name: "3",
    },
    {
      hash: "",
      name: "4",
    },
    {
      hash: "",
      name: "5",
    },
    {
      hash: "",
      name: "6",
    },
    {
      hash: "",
      name: "7",
    },
    {
      hash: "",
      name: "8",
    },
    {
      hash: "",
      name: "9",
    },
    {
      hash: "",
      name: "10",
    },
    {
      hash: "",
      name: "11",
    },
    {
      hash: "",
      name: "12",
    },
  ];
  const output = [
    {
      name: "Intros",
      value: "▫ 1\n▫ 2\n▫ 3\n▫ 4\n▫ 5\n▫ 6\n▫ 7\n▫ 8\n▫ 9\n▫ 10",
      inline: true,
    },
    {
      name: ".",
      value: "▫ 11\n▫ 12",
      inline: true,
    },
  ];

  t.deepEqual(output, listIntro.assembleFields(input));
});
