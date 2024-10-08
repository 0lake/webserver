package ru.itmo;

import com.fastcgi.FCGIInterface;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

public class Main {
    private static final String RESPONSE_TEMPLATE = "Content-Type: application/json\nContent-Length: %d\n\n%s";

    public static void main(String[] args) {
        FCGIInterface fcgi = new FCGIInterface();
        while (fcgi.FCGIaccept() >= 0) {
            long startTime = System.nanoTime();
            try {
                String body = readRequestBody();
                JSONObject jsonRequest = new JSONObject(body);

                double x = jsonRequest.getDouble("x");
                double y = jsonRequest.getDouble("y");
                double r = jsonRequest.getDouble("r");

                boolean isInside = calculate(x, y, r);
                long endTime = System.nanoTime();

                String jsonResponse = new JSONObject()
                        .put("result", isInside)
                        .put("x", x)
                        .put("y", y)
                        .put("r", r)
                        .put("currentTime", LocalDateTime.now().toString())
                        .put("executionTime", (endTime - startTime) + "ns")
                        .toString();
                sendJson(jsonResponse);
            } catch (Exception e) {
                sendJson(new JSONObject().put("error", e.getMessage()).toString());
            }
        }
    }

    /**
     * Метод для проверки, входит ли точка в закрашенную область
     *
     * @param x координата X точки
     * @param y координата Y точки
     * @param r радиус, заданный пользователем
     * @return true, если точка попадает в закрашенную область, false в противном случае
     */
    private static boolean calculate(double x, double y, double r) {
        // Предварительные вычисления
        double halfR = r / 2; // R/2 для удобства
        double quarterCircleRadiusSquared = halfR * halfR; // (R/2)^2

        // Проверка для правой нижней области (прямоугольник)
        if (x >= 0 && x <= r && y >= -halfR && y <= 0) {
            return true;
        }

        // Проверка для левой верхней области (треугольник)
        if (x <= 0 && y >= 0 && y <= x + r) {
            return true;
        }

        // Проверка для левой нижней области (четверть круга)
        if (x <= 0 && y <= 0 && (x * x + y * y <= quarterCircleRadiusSquared)) {
            return true;
        }

        // Если точка не попала ни в одну из областей
        return false;
    }


    private static void sendJson(String jsonDump) {
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
// httpd -f ~/httpd-root/conf/httpd.conf -k start
// java -DFCGI_PORT=40952 -jar ~/httpd-root/fcgi-bin/server.jar