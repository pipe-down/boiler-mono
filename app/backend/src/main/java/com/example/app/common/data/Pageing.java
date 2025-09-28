package com.example.app.common.data;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
public class Pageing {
  public static Pageable of(Integer page, Integer size, String sort){
    int p = page==null?0:Math.max(0, page);
    int s = size==null?20:Math.min(200, Math.max(1, size));
    Sort sortObj = Sort.unsorted();
    if (sort != null && !sort.isBlank()) {
      // format: field,asc|desc; multiple separated by ;
      String[] parts = sort.split(";");
      for (String part : parts) {
        String[] kv = part.trim().split(",");
        if (kv.length >= 1 && !kv[0].isBlank()) {
          Sort.Direction dir = (kv.length >=2 && "desc".equalsIgnoreCase(kv[1]))? Sort.Direction.DESC : Sort.Direction.ASC;
          sortObj = sortObj.and(Sort.by(dir, kv[0].trim()));
        }
      }
    } else {
      sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
    }
    return PageRequest.of(p, s, sortObj);
  }
}
