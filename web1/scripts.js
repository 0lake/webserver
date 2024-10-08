let tableCreated = false;

function sendData() {
    const x = document.getElementById('x').value;
    const y = document.getElementById('y').value;
    const r = document.getElementById('r').value;

    if (!validateInput(x, y, r)) {
        return;
    }

    const data = JSON.stringify({x: parseFloat(x), y: parseFloat(y), r: parseFloat(r)});

    fetch('/fcgi-bin/server.jar', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: data
    })
        .then(response => response.json())
        .then(json => {
            if (!tableCreated) {
                createTable();
                tableCreated = true;
            }
            addRow(json);
        })
        .catch(error => console.error('Error:', error));
}

function createTable() {
    const resultContainer = document.getElementById('results');
    const table = document.createElement('table');
    table.setAttribute('id', 'resultTable');
    table.innerHTML = `
        <tr>
            <th>X</th>
            <th>Y</th>
            <th>R</th>
            <th>Result</th>
            <th>Current Time</th>
            <th>Execution Time</th>
        </tr>
    `;
    resultContainer.appendChild(table);
}

function addRow(json) {
    const resultTable = document.getElementById('resultTable');

    // Создаем новую строку с результатами
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${json.x}</td>
        <td>${json.y}</td>
        <td>${json.r}</td>
        <td>${json.result}</td>
        <td>${json.currentTime}</td>
        <td>${json.executionTime}</td>
    `;
    resultTable.appendChild(newRow);

    // Сохраняем результат в localStorage
    let results = JSON.parse(localStorage.getItem('results')) || [];
    results.push(json);
    localStorage.setItem('results', JSON.stringify(results));
}


function validateInput(x, y, r) {
    const errorMessage = document.getElementById('error-message');

    // Проверка на корректность введенных значений
    if (isNaN(x) || isNaN(y) || isNaN(r) || r < 1 || r > 4 || y<-3 || y>3) {
        // Если данные некорректны, показываем сообщение об ошибке
        errorMessage.textContent = 'Invalid input values. Please enter correct X, Y, and R values.';
        errorMessage.style.display = 'block';
        return false;
    }

    // Если данные корректны, скрываем сообщение об ошибке
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
    return true;
}


function drawCoordinateSystem() {
    const canvas = document.getElementById("plotCanvas");
    const ctx = canvas.getContext("2d");

    // Задаем размеры canvas, чтобы они соответствовали его контейнеру
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientWidth; // Соотношение 1:1

    // Очищаем холст
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Центр канваса (центр системы координат)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = canvas.width / 3; // Масштаб для отображения R (динамически)

    // Рисуем закрашенные област
    // Треугольник
    ctx.fillStyle = "#4a90e2";
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + scale, centerY); // (R, 0)
    ctx.lineTo(centerX, centerY + scale / 2); // (0, -R/2)
    ctx.closePath();
    ctx.fill();

    // Четверть круга
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, scale / 2, 0, -0.5 * Math.PI, true);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fill();

    // Прямоугольник
    ctx.beginPath();
    ctx.rect(centerX, centerY, -scale / 2, -scale);
    ctx.closePath();
    ctx.fill();

    // Рисуем оси координат
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    // Ось X
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    // Ось Y
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    // Добавляем стрелочки на концах осей только сверху и справа
    drawArrow(ctx, canvas.width - 10, centerY, canvas.width, centerY);
    drawArrow(ctx, centerX, 10, centerX, 0);

    // Рисуем отметки на осях для R
    ctx.font = "14px Arial";
    ctx.fillStyle = "rgb(0,0,0)";

    // Отметки по оси X
    drawTickMark(ctx, centerX + scale, centerY, 10); // R
    ctx.fillText("R", centerX + scale - 5, centerY - 20);

    drawTickMark(ctx, centerX + scale / 2, centerY, 10); // R/2
    ctx.fillText("R/2", centerX + scale / 2 - 10, centerY - 20);

    drawTickMark(ctx, centerX - scale, centerY, 10); // -R
    ctx.fillText("-R", centerX - scale - 10, centerY - 20);

    drawTickMark(ctx, centerX - scale / 2, centerY, 10); // -R/2
    ctx.fillText("-R/2", centerX - scale / 2 - 15, centerY - 20);

    // Рисуем отметки по оси Y (горизонтально)
    drawTickMark(ctx, centerX, centerY - scale, 10); // R
    ctx.fillText("R", centerX + 10, centerY - scale + 5); // Сдвинуть текст вправо

    drawTickMark(ctx, centerX, centerY - scale / 2, 10); // R/2
    ctx.fillText("R/2", centerX + 10, centerY - scale / 2 + 5); // Сдвинуть текст вправо

    drawTickMark(ctx, centerX, centerY + scale / 2, 10); // -R/2
    ctx.fillText("-R/2", centerX + 10, centerY + scale / 2 + 5); // Сдвинуть текст вправо

    drawTickMark(ctx, centerX, centerY + scale, 10); // -R
    ctx.fillText("-R", centerX + 10, centerY + scale + 5); // Сдвинуть текст вправо

    // Добавляем горизонтальные палочки на оси Y
    const tickSize = 5; // Длина горизонтальных палочек
    const tickYPositions = [
        centerY - scale,
        centerY - scale / 2,
        centerY + scale / 2,
        centerY + scale
    ];

    tickYPositions.forEach(y => {
        ctx.beginPath();
        ctx.moveTo(centerX - tickSize, y);
        ctx.lineTo(centerX + tickSize, y);
        ctx.strokeStyle = "#000"; // Цвет палочек
        ctx.stroke();
    });

    // Подписи осей
    ctx.fillText("X", canvas.width - 30, centerY - 10); // Подпись оси X справа
    ctx.fillText("Y", centerX + 10, 20); // Подпись оси Y сверху
}



function drawArrow(ctx, fromX, fromY, toX, toY) {
    const headLength = 10; // Длина стрелки
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

function drawTickMark(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size / 2);
    ctx.lineTo(x, y + size / 2);
    ctx.stroke();
}


function loadResults() {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    if (results.length > 0) {
        createTable(); // Создаём таблицу, если её ещё нет
        results.forEach(result => addRow(result));
        tableCreated = true; // Указываем, что таблица создана
    }
}

window.onload = function() {
    drawCoordinateSystem(); // Рисуем систему координат
    loadResults();          // Загружаем результаты из localStorage
};
