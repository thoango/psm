const fs = require("fs");
const csv = require("csv-parser");

const csvData = "PSMrawdata.csv";

const unitPrice = 50;

const data = { tooCheap: [], cheap: [], expensive: [], tooExpensive: [] };

async function readCSV(csvFile) {
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on("data", (row) => {
        if (row["安すぎる"]) {
          data["tooCheap"].push(+row["安すぎる"]);
        }
        if (row["安い"]) {
          data["cheap"].push(+row["安い"]);
        }
        if (row["高い"]) {
          data["expensive"].push(+row["高い"]);
        }
        if (row["高すぎる"]) {
          data["tooExpensive"].push(+row["高すぎる"]);
        }
      })
      .on("end", () => {
        resolve();
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

function calculatePercent(data, type) {
  const percentData = {};

  for (let i = unitPrice; i <= data[data.length - 1]; i += unitPrice) {
    percentData[i] = 0;
    let count = 0;

    for (let j = 0; j < data.length; j++) {
      if (type === "expensive") {
        if (data[j] <= i) {
          count++;
        }
        if (data[j] > i) {
          break;
        }
      }

      if (type === "cheap") {
        if (data[j] >= i) {
          count++;
        }
      }
    }
    percentData[i] = ((count / data.length) * 100).toFixed(1);
  }

  return percentData;
}

function calculateCrossingPoint(point1, point2, point3, point4) {
  const crossingPoint = {};

  crossingPoint.x =
    ((point3.y - point1.y) * (point1.x - point2.x) * (point3.x - point4.x) +
      point1.x * (point1.y - point2.y) * (point3.x - point4.x) -
      point3.x * (point3.y - point4.y) * (point1.x - point2.x)) /
    ((point1.y - point2.y) * (point3.x - point4.x) -
      (point1.x - point2.x) * (point3.y - point4.y));
  crossingPoint.y =
    (crossingPoint.x * (point1.y - point2.y)) / (point1.x - point2.x) +
    point1.y -
    (point1.x * (point1.y - point2.y)) / (point1.x - point2.x);

  crossingPoint.x = Math.ceil(crossingPoint.x);

  return crossingPoint;
}

function findCrossingPoint(cheapData, expData) {
  for (let i = unitPrice; i <= +Object.keys(cheapData).pop(); i += unitPrice) {
    if (+cheapData[i] - +expData[i] === 0) {
      return { x: i, y: cheapData[i] };
    }

    if (+cheapData[i] - +expData[i] < 0) {
      return calculateCrossingPoint(
        {
          x: i - unitPrice,
          y: +expData[i - unitPrice],
        },
        { x: i, y: +expData[i] },
        {
          x: i - unitPrice,
          y: +cheapData[i - unitPrice],
        },
        { x: i, y: +cheapData[i] }
      );
    }
  }
}

async function main() {
  await readCSV(csvData);

  if (data["tooCheap"].length > 0) {
    data["tooCheap"].sort((a, b) => a - b);
  }
  if (data["cheap"].length > 0) {
    data["cheap"].sort((a, b) => a - b);
  }
  if (data["expensive"].length > 0) {
    data["expensive"].sort((a, b) => a - b);
  }
  if (data["tooExpensive"].length > 0) {
    data["tooExpensive"].sort((a, b) => a - b);
  }

  console.log(
    "最高価格： " +
      findCrossingPoint(
        calculatePercent(data.cheap, "cheap"),
        calculatePercent(data.tooExpensive, "expensive")
      ).x +
      "円\n" +
      "妥協価格： " +
      findCrossingPoint(
        calculatePercent(data.cheap, "cheap"),
        calculatePercent(data.expensive, "expensive")
      ).x +
      "円\n" +
      "理想価格： " +
      findCrossingPoint(
        calculatePercent(data.tooCheap, "cheap"),
        calculatePercent(data.tooExpensive, "expensive")
      ).x +
      "円\n" +
      "最低品質保証価格： " +
      findCrossingPoint(
        calculatePercent(data.tooCheap, "cheap"),
        calculatePercent(data.expensive, "expensive")
      ).x +
      "円"
  );
}

main();
