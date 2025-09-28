package com.example.app.common.data;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.*;
public class Specs {
  public static <T> Specification<T> textLike(String q, String... fields){
    return (root, query, cb) -> {
      if (q == null || q.isBlank() || fields == null || fields.length == 0) return null;
      String like = "%" + q.toLowerCase() + "%";
      Predicate or = null;
      for (String f : fields) {
        try {
          Path<String> p = root.get(f);
          Predicate one = cb.like(cb.lower(p.as(String.class)), like);
          or = (or == null) ? one : cb.or(or, one);
        } catch (IllegalArgumentException ignore) {}
      }
      return or;
    };
  }
}
