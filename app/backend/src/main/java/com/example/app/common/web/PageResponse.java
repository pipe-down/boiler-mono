package com.example.app.common.web;

import java.util.List;
import java.util.Map;

public record PageResponse<T>(
        List<T> content,
        int number,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last,
        Map<String, Object> sort
) {
}
