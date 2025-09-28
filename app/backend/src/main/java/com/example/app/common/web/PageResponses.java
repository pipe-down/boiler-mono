package com.example.app.common.web;

import org.springframework.data.domain.Page;

import java.util.Map;

public final class PageResponses {

    private PageResponses() {
    }

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                Map.of(
                        "sorted", page.getSort().isSorted(),
                        "unsorted", page.getSort().isUnsorted(),
                        "empty", page.getSort().isEmpty()
                )
        );
    }
}
