# 四孔灯检查新增字段列表

以下字段需要添加到数据库的医疗记录表中：

## 2m 检查相关字段
- `four_hole_lamp_2m` (VARCHAR/CHAR) - 2m检查选项：'4' 或 '5'
- `four_hole_lamp_2m_dominant` (VARCHAR/CHAR) - 2m优势眼：'黄'、'红'、'绿'、'红绿交替'
- `four_hole_lamp_2m_horizontal` (VARCHAR/CHAR) - 2m水平选项：'左红右绿'、'右红左绿'
- `four_hole_lamp_2m_vertical` (VARCHAR/CHAR) - 2m垂直选项：'右高'、'左高'

## 40cm 检查相关字段
- `four_hole_lamp_40cm` (VARCHAR/CHAR) - 40cm检查选项：'4' 或 '5'
- `four_hole_lamp_40cm_dominant` (VARCHAR/CHAR) - 40cm优势眼：'黄'、'红'、'绿'、'红绿交替'
- `four_hole_lamp_40cm_horizontal` (VARCHAR/CHAR) - 40cm水平选项：'左红右绿'、'右红左绿'
- `four_hole_lamp_40cm_vertical` (VARCHAR/CHAR) - 40cm垂直选项：'右高'、'左高'

## 抑制检查相关字段
- `four_hole_lamp_suppression` (VARCHAR/CHAR) - 抑制选项：'2'、'3'、'交替'
- `four_hole_lamp_suppression_2_type` (VARCHAR/CHAR) - 右眼抑制类型：'全程抑制'、'非全程抑制'
- `four_hole_lamp_suppression_2_distance` (DECIMAL/FLOAT) - 右眼抑制距离（单位：m）
- `four_hole_lamp_suppression_2_direction` (VARCHAR/CHAR) - 右眼抑制方向：'内'、'外'
- `four_hole_lamp_suppression_3_type` (VARCHAR/CHAR) - 左眼抑制类型：'全程抑制'、'非全程抑制'
- `four_hole_lamp_suppression_3_distance` (DECIMAL/FLOAT) - 左眼抑制距离（单位：m）
- `four_hole_lamp_suppression_3_direction` (VARCHAR/CHAR) - 左眼抑制方向：'内'、'外'
- `four_hole_lamp_suppression_alternate_within_distance` (DECIMAL/FLOAT) - 交替抑制以内距离（单位：m）
- `four_hole_lamp_suppression_alternate_within_eye` (VARCHAR/CHAR) - 交替抑制以内眼别：'右'、'左'

## 字段类型建议
- VARCHAR/CHAR 字段建议长度：50（足够存储所有选项值）
- DECIMAL/FLOAT 字段建议精度：DECIMAL(10, 1) 或 FLOAT（用于存储距离值）
- 所有字段建议设置为 NULLABLE（允许为空）

## SQL 示例（MySQL）
```sql
ALTER TABLE medical_records 
ADD COLUMN four_hole_lamp_2m VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_2m_dominant VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_2m_horizontal VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_2m_vertical VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_40cm VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_40cm_dominant VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_40cm_horizontal VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_40cm_vertical VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_suppression VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_suppression_2_type VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_suppression_2_distance DECIMAL(10, 1) NULL,
ADD COLUMN four_hole_lamp_suppression_2_direction VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_suppression_3_type VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_suppression_3_distance DECIMAL(10, 1) NULL,
ADD COLUMN four_hole_lamp_suppression_3_direction VARCHAR(50) NULL,
ADD COLUMN four_hole_lamp_suppression_alternate_within_distance DECIMAL(10, 1) NULL,
ADD COLUMN four_hole_lamp_suppression_alternate_within_eye VARCHAR(50) NULL;
```

