---
name: antd-form
description: Ant Design Form best practices for SBRB project. Use when building or reviewing forms with Form.Item, dependent fields, layout patterns, and numeric inputs.
version: 1.0.0
---

# Ant Design Form

Best practices for building forms in the SBRB project using Ant Design `Form` and `Form.Item`.

## When to Use This Skill

- Building any form with Ant Design `Form` component
- Reviewing form code for correctness or performance issues
- Implementing dependent/conditional field logic
- Configuring label/input layout (horizontal, vertical, grid)
- Using numeric input fields

---

## Rules

### 1. Use `Form.Item` with `label` prop — never render labels manually

**❌ WRONG — Manual label with asterisk**
```tsx
<div className="flex gap-6 h-10 items-center">
  <p className="text-14 text-gray80 w-[91px]">
    {t("fieldLabel")} <span className="text-error">*</span>
  </p>
  <Form.Item name="fieldName">
    <CustomInput />
  </Form.Item>
</div>
```

**✅ CORRECT — Use `Form.Item` with `label` and `rules`**
```tsx
<Form.Item
  name="fieldName"
  label={t("fieldLabel")}
  rules={[{ required: true }]}
>
  <CustomInput />
</Form.Item>
```

**With custom layout via `labelCol` / `wrapperCol`:**
```tsx
<Form.Item
  name="fieldName"
  label={t("fieldLabel")}
  rules={[{ required: true }]}
  className="mb-0! flex-1"
  labelCol={{ flex: "91px" }}
  wrapperCol={{ flex: 1 }}
>
  <CustomInput />
</Form.Item>
```

**Benefits:**
- Automatic required mark via `rules={[{ required: true }]}`
- Consistent label styling across all forms
- No manual `<span className="text-error">*</span>`
- Built-in form validation integration

---

### 2. Use `dependencies` instead of `shouldUpdate` for dependent fields

**❌ WRONG — `shouldUpdate` re-renders on every form change**
```tsx
<Form.Item name="plan" noStyle>
  <Form.Item noStyle shouldUpdate>
    {({ getFieldValue }) => {
      const selectedCarrier = getFieldValue("carrier");
      // Render dependent content
    }}
  </Form.Item>
</Form.Item>
```

**✅ CORRECT — `dependencies` only re-renders when specified fields change**
```tsx
<Form.Item
  name="plan"
  label={t("planLabel")}
  rules={[{ required: true }]}
>
  <Form.Item noStyle dependencies={["carrier"]}>
    {({ getFieldValue }) => {
      const selectedCarrier = getFieldValue("carrier");
      return <YourComponent carrier={selectedCarrier} />;
    }}
  </Form.Item>
</Form.Item>
```

**When to use each:**
- `dependencies={[fieldNames]}` — content depends on specific fields **(PREFERRED)**
- `shouldUpdate` — only when re-render must respond to ALL form changes or complex multi-field conditions

---

### 3. Nested `Form.Item` for combined name binding + dependent rendering

When you need both a `name` binding AND conditional rendering based on another field:

```tsx
<Form.Item
  name="fieldName"
  label={t("label")}
  rules={[{ required: true }]}
>
  <Form.Item noStyle dependencies={["otherField"]}>
    {({ getFieldValue }) => {
      const dependency = getFieldValue("otherField");
      return <YourComponent enabled={dependency} />;
    }}
  </Form.Item>
</Form.Item>
```

---

### 4. Set `labelCol` / `wrapperCol` at Form level when shared across items

**❌ WRONG — Repeating layout props on every item**
```tsx
<Form form={form}>
  <Form.Item name="field1" label={t("label1")} labelCol={{ flex: "120px" }} wrapperCol={{ flex: 1 }}>
    <CustomInput />
  </Form.Item>
  <Form.Item name="field2" label={t("label2")} labelCol={{ flex: "120px" }} wrapperCol={{ flex: 1 }}>
    <CustomInput />
  </Form.Item>
</Form>
```

**✅ CORRECT — Declare once at Form level, override per item only when needed**
```tsx
<Form form={form} labelCol={{ flex: "120px" }} wrapperCol={{ flex: 1 }}>
  <Form.Item name="field1" label={t("label1")}>
    <CustomInput />
  </Form.Item>
  <Form.Item name="field2" label={t("label2")}>
    <CustomInput />
  </Form.Item>
</Form>
```

#### Layout variants

**Horizontal (inline label):**
```tsx
<Form.Item
  name="fieldName"
  label={t("label")}
  rules={[{ required: true }]}
  labelCol={{ flex: "91px" }}
  wrapperCol={{ flex: 1 }}
  className="mb-0!"
>
  <CustomInput />
</Form.Item>
```

**Vertical (default):**
```tsx
<Form.Item name="fieldName" label={t("label")} rules={[{ required: true }]}>
  <CustomInput />
</Form.Item>
```

**Grid (24-column):**
```tsx
<Form.Item
  name="fieldName"
  label={t("label")}
  labelCol={{ span: 6 }}
  wrapperCol={{ span: 18 }}
>
  <CustomInput />
</Form.Item>
```

**Key points:**
- Use `flex` for fluid width (`flex: "91px"`, `flex: 1`)
- Use `span` for 24-column grid layout
- Override at item level only when one item differs from the Form default

---

### 5. Use `InputNumber` for numeric fields — never `CustomInput type="number"`

**❌ WRONG**
```tsx
<Form.Item name="price" label={t("priceLabel")} rules={[{ required: true }]}>
  <CustomInput type="number" placeholder={t("pricePlaceholder")} />
</Form.Item>
```

**✅ CORRECT**
```tsx
import { InputNumber } from "antd";

<Form.Item name="price" label={t("priceLabel")} rules={[{ required: true }]}>
  <InputNumber
    placeholder={t("pricePlaceholder")}
    className="w-full"
    min={0}
  />
</Form.Item>
```
