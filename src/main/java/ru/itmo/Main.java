package ru.itmo;

import com.fastcgi.FCGIInterface;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public class Main {
    private static final String RESPONSE_TEMPLATE = "Content-Type: application/json\nContent-Length: %d\n\n%s";

    public static void main(String[] args) {
        FCGIInterface fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            long startTime = System.currentTimeMillis(); // Начало отсчета времени в миллисекундах
            try {
                String body = readRequestBody();
                JSONObject jsonRequest = new JSONObject(body);

                double x = jsonRequest.getDouble("x");
                double y = jsonRequest.getDouble("y");
                double r = jsonRequest.getDouble("r");

                // Валидация значений
                String validationError = validateInput(x, y, r);
                if (validationError != null) {
                    // Отправляем ошибку 400 Bad Request
                    sendJson(new JSONObject().put("error", validationError).toString(), 400);
                    continue; // Пропускаем дальнейшую обработку
                }

                boolean isInside = calculate(x, y, r);
                long endTime = System.currentTimeMillis(); // Конец отсчета времени в миллисекундах

                String jsonResponse = new JSONObject()
                        .put("result", isInside)
                        .put("x", x)
                        .put("y", y)
                        .put("r", r)
                        .put("currentTime", LocalDateTime.now().toString())
                        .put("executionTime", (endTime - startTime) + "ms") // Время выполнения в мс
                        .toString();
                sendJson(jsonResponse, 200); // Код 200 - OK
            } catch (Exception e) {
                sendJson(new JSONObject().put("error", e.getMessage()).toString(), 500); // Ошибка сервера
            }
        }
    }

    private static boolean calculate(double x, double y, double r) {
        double halfR = r / 2;
        double quarterCircleRadiusSquared = halfR * halfR;

        // Проверка для левой верхней области (прямоугольник)
        if (x <= 0 && x >= -halfR && y <= r && y >= 0) {
            return true;
        }

        // Проверка для правой нижней области (треугольник)
        if (x >= 0 && x <= r && y <= 0 && y >= -x - halfR && y >= -halfR) {
            return true;
        }

        // Проверка для левой нижней области (четверть круга)
        if (x >= 0 && y >= 0 && (x * x + y * y <= quarterCircleRadiusSquared)) {
            return true;
        }

        return false;
    }

    private static String validateInput(double x, double y, double r) {
        // Определение допустимых значений
        List<Double> validXValues = Arrays.asList(-2.0, -1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0);
        List<Double> validYValues = Arrays.asList(-3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0);
        List<Double> validRValues = Arrays.asList(1.0, 2.0, 3.0, 4.0);

        // Валидация R
        if (!validRValues.contains(r)) {
            return "Radius (r) must be one of the following values: " + validRValues;
        }

        // Валидация Y
        if (!validYValues.contains(y)) {
            return "Y must be one of the following values: " + validYValues;
        }

        // Валидация X
        if (!validXValues.contains(x)) {
            return "X must be one of the following values: " + validXValues;
        }

        return null; // Все значения валидны
    }


    private static void sendJson(String jsonDump, int statusCode) {
        System.out.printf("Status: %d\n", statusCode);
        System.out.printf(RESPONSE_TEMPLATE + "%n", jsonDump.getBytes(StandardCharsets.UTF_8).length, jsonDump);
    }

    private static String readRequestBody() throws IOException {
        FCGIInterface.request.inStream.fill();
        int contentLength = FCGIInterface.request.inStream.available();
        var buffer = ByteBuffer.allocate(contentLength);
        var readBytes = FCGIInterface.request.inStream.read(buffer.array(), 0, contentLength);
        var requestBodyRaw = new byte[readBytes];
        buffer.get(requestBodyRaw);
        buffer.clear();
        return new String(requestBodyRaw, StandardCharsets.UTF_8);
    }
}
